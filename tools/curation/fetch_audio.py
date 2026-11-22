#!/usr/bin/env python3
"""Download candidate audio for a species from Wikimedia Commons, with provenance.

Every download is checked against the SHA1 the Commons API reports for that file,
and the result is written to a manifest so a clip can always be traced back to an
auditable original. Nothing here writes into the app; it stages material for
audition.

The licence is settled **before** the download, by `licence.py` and the app's own
`licence-policy.json`: an NC or ND recording is refused and never lands on disk, and
an unrecognised licence fails closed. Refusals are written into the manifest under
`rejected` so a file that was found and declined is visible rather than absent.

    python3 fetch_audio.py --term "Turdus migratorius" \
        --include 'Turdus migratorius|American Robin|Turdus-migratorius' \
        --exclude 'Grey Jay|Grosbeak|Tanager|Mystery|LL-Q1860' \
        --dest ~/projects/birdie-curation/american-robin/source \
        --manifest ~/projects/birdie-curation/american-robin/manifest.json
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from commons_audio import query, strip_html  # noqa: E402
from licence import classify  # noqa: E402

# Wikimedia rate-limits bulk fetches and wants a descriptive agent with a contact.
UA = "BirdieCuration/0.1 (offline game asset provenance research; alex@example.invalid)"


def download(url, local, attempts=5):
    """Fetch url to local, backing off on 429/5xx. Downloads to a temp name first."""
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=180) as r:
                data = r.read()
            with open(local + ".part", "wb") as f:
                f.write(data)
            os.replace(local + ".part", local)
            return
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or i == attempts - 1:
                raise
            wait = 5 * 2**i
            print(f"  HTTP {e.code}; retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
        except urllib.error.URLError:
            if i == attempts - 1:
                raise
            time.sleep(5 * 2**i)


def probe_duration(path):
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", path],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return round(float(out), 2)
    except (subprocess.CalledProcessError, ValueError):
        return None


def sha1_of(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--term", required=True)
    ap.add_argument("--include", required=True, help="regex the title must match")
    ap.add_argument("--exclude", default=None, help="regex that disqualifies a title")
    ap.add_argument("--dest", required=True)
    ap.add_argument("--manifest", required=True)
    args = ap.parse_args()

    inc = re.compile(args.include, re.I)
    exc = re.compile(args.exclude, re.I) if args.exclude else None

    pages = query(args.term, limit=50).get("query", {}).get("pages", [])
    os.makedirs(args.dest, exist_ok=True)

    entries = []
    rejected = []
    for p in sorted(pages, key=lambda p: p.get("title", "")):
        title = p.get("title", "")
        if not inc.search(title) or (exc and exc.search(title)):
            continue
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata", {})
        url = ii.get("url", "").split("?")[0]
        licence_name = strip_html((em.get("LicenseShortName") or {}).get("value", ""))
        licence_url = (em.get("LicenseUrl") or {}).get("value", "")
        verdict = classify(licence_name, licence_url)
        if not verdict.allowed:
            # Refuse before fetching: a forbidden file that never touches the disk
            # cannot be trimmed, measured, auditioned, or shipped by mistake.
            rejected.append(
                {
                    "title": title,
                    "license": licence_name or "?",
                    "licenseUrl": licence_url,
                    "reason": verdict.reason,
                }
            )
            print(f"DENY     {title}\n         {verdict.reason}")
            continue
        want = ii.get("sha1")
        local = os.path.join(args.dest, title.removeprefix("File:").replace(" ", "_"))
        if not os.path.exists(local):
            download(url, local)
            time.sleep(1.0)  # be a good citizen; Commons 429s on bursts
        got = sha1_of(local)
        ok = got == want
        if not ok:
            print(f"CHECKSUM MISMATCH {title}: api={want} local={got}", file=sys.stderr)
        desc = strip_html((em.get("ImageDescription") or {}).get("value", ""))
        entries.append(
            {
                "title": title,
                "local": local,
                "license": licence_name or "?",
                "licenseUrl": licence_url,
                "appLicense": verdict.licence,
                "recordist": strip_html((em.get("Artist") or {}).get("value", "?")),
                "description": desc,
                # Xeno-canto mirrors carry the recordist's own Type: field.
                "xcType": (re.search(r"\bType:\s*([a-z ,]+?)\s+Genus", desc, re.I) or [None, None])[1],
                "durationSeconds": probe_duration(local),
                "sourceUrl": "https://commons.wikimedia.org/wiki/" + title.replace(" ", "_"),
                "fileUrl": url,
                "sha1": got,
                "sha1Verified": ok,
            }
        )
        state = "ok" if ok else "MISMATCH"
        print(f"{state:8} {entries[-1]['durationSeconds'] or 0:7.2f}s  {entries[-1]['license']:<16} {title}")

    with open(args.manifest, "w") as f:
        json.dump(
            {
                "term": args.term,
                "policy": "web/src/species/licence-policy.json",
                "files": entries,
                "rejected": rejected,
            },
            f,
            indent=1,
        )
    bad = [e for e in entries if not e["sha1Verified"]]
    print(
        f"\n{len(entries)} files, {len(entries) - len(bad)} verified, "
        f"{len(rejected)} refused on licence, manifest -> {args.manifest}"
    )
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())

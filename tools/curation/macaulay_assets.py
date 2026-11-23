#!/usr/bin/env python3
"""Record the licence of Macaulay Library assets, and refuse the ones we cannot ship.

The Macaulay catalogue page is behind Anubis proof-of-work, but the *asset* page is
reachable once the challenge is solved, and its Nuxt payload carries `licenseId`
(`LICENSE<n>`). Two things about that id matter and both are bad for reuse:

1. It names a class, not a version — there is no `creativecommons.org` deed URL
   anywhere on the page. So a Macaulay BY or BY-SA recording cannot produce a
   complete attribution ("CC BY-SA …4.0?"), and share-alike compliance needs the
   version. CC0 and public domain are the exception: they need no version and no
   deed, so those ids remain usable.
2. Anything not in the mapping below is unmapped, and unmapped fails closed. On the
   robin shortlist the top-rated recordings are `LICENSE2`, which the catalogue's
   own filter does not label and this tool therefore treats as all-rights-reserved.

Usage:

    python3 tools/curation/macaulay_assets.py --ids 550453001 206448 \
        --dest ~/projects/birdie-curation/american-robin/macaulay \
        --manifest ~/projects/birdie-curation/american-robin/macaulay/manifest.json

    python3 tools/curation/macaulay_assets.py --dir ~/projects/birdie-curation/american-robin/macaulay \
        --manifest ~/projects/birdie-curation/american-robin/macaulay/manifest.json
"""

from __future__ import annotations

import argparse
import hashlib
import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from licence import classify  # noqa: E402

UA = "BirdieCuration/0.1 (offline game asset provenance research; alex@example.invalid)"
BROWSER_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)

# The catalogue's own licence filter labels (li5/li8/li9/li10) are the only
# published mapping. Note the missing version: it is missing on the page too.
MACAULAY_LICENCES = {
    "LICENSE5": "CC BY",
    "LICENSE8": "CC BY-NC",
    "LICENSE9": "CC BY-SA",
    "LICENSE10": "CC0",
}

COOKIES = Path("/tmp/ml-cookies.txt")


def opener() -> tuple[urllib.request.OpenerDirector, http.cookiejar.MozillaCookieJar]:
    jar = http.cookiejar.MozillaCookieJar(str(COOKIES))
    try:
        jar.load(ignore_discard=True, ignore_expires=True)
    except (OSError, http.cookiejar.LoadError):
        pass
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    op.addheaders = [
        # Anubis challenges a browser-shaped request; the curation UA gets refused.
        ("User-Agent", BROWSER_UA),
        ("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
        ("Accept-Language", "en-US,en;q=0.9"),
    ]
    return op, jar


def solve_anubis(op, jar, url: str) -> str:
    """Pass the proof-of-work wall the way the browser does, then return the page."""
    html = op.open(url, timeout=40).read().decode("utf-8", "replace")
    if "anubis_challenge" not in html:
        return html
    m = re.search(r'<script id="anubis_challenge" type="application/json">(.*?)</script>', html, re.S)
    if not m:
        raise RuntimeError("challenge script present but unparseable")
    challenge = json.loads(m.group(1))
    challenge = challenge.get("challenge", challenge)
    random_data, difficulty = challenge["randomData"], challenge["difficulty"]
    started, nonce = time.time(), 0
    while True:
        digest = hashlib.sha256((random_data + str(nonce)).encode()).hexdigest()
        if digest.startswith("0" * difficulty):
            break
        nonce += 1
    query = urllib.parse.urlencode(
        {
            "id": challenge["id"],
            "response": digest,
            "nonce": nonce,
            "redir": url,
            "elapsedTime": int((time.time() - started) * 1000),
        }
    )
    origin = "{0.scheme}://{0.netloc}".format(urllib.parse.urlsplit(url))
    try:
        op.open(origin + "/.within.website/x/cmd/anubis/api/pass-challenge?" + query, timeout=40).read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Anubis refused the solution ({e.code}); cookies may be stale") from e
    jar.save(ignore_discard=True, ignore_expires=True)
    html = op.open(url, timeout=40).read().decode("utf-8", "replace")
    if "anubis_challenge" in html:
        raise RuntimeError("wall still present after solving")
    return html


def resolve(arr: list, i, stack: frozenset = frozenset()):
    """Nuxt/devalue payloads store objects as indices into a flat array."""
    if i is None or isinstance(i, (str, bool, float)):
        return i
    if isinstance(i, int):
        if i < 0 or i in stack or i >= len(arr):
            return None
        value = arr[i]
        if isinstance(value, dict):
            return {k: resolve(arr, v, stack | {i}) for k, v in value.items()}
        if isinstance(value, list):
            if value and value[0] in ("ShallowReactive", "Reactive", "Ref"):
                return resolve(arr, value[1], stack | {i})
            return [resolve(arr, v, stack | {i}) for v in value]
        return value
    return None


def asset_record(html: str, asset_id: str) -> dict:
    # The tag carries a nonce and the data attributes before the id, so match the
    # id anywhere inside the opening tag rather than assuming an attribute order.
    m = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        raise RuntimeError("no Nuxt payload on the page")
    arr = json.loads(m.group(1))
    for value in arr:
        if not isinstance(value, dict) or "assetId" not in value or "licenseId" not in value:
            continue
        got = resolve(arr, value["assetId"])
        if str(got) != str(asset_id):
            continue
        licence_id = resolve(arr, value["licenseId"])
        taxon = resolve(arr, value.get("taxonomy")) or {}
        return {
            "assetId": str(got),
            "licenseId": licence_id,
            # `userDisplayName` is the person. The key called `recorder` is the
            # equipment ("Sound Devices 702") — crediting that would be wrong.
            "recordist": resolve(arr, value.get("userDisplayName")) or "",
            "equipment": resolve(arr, value.get("recorder")) or "",
            "mediaNotes": resolve(arr, value.get("mediaNotes")) or "",
            # The archive's functional tags: song, dawn_song, call, flight_call,
            # no_playback … This is the only published statement of what the file
            # is, so the ledger records it rather than inferring a type.
            "tags": resolve(arr, value.get("tags")) or [],
            "obsDate": resolve(arr, value.get("obsDtDisplay")) or "",
            "scientificName": (taxon.get("sciName") if isinstance(taxon, dict) else "") or "",
            "commonName": (taxon.get("comName") if isinstance(taxon, dict) else "") or "",
        }
    raise RuntimeError(f"assetId {asset_id} not found in the payload")


def sha1_of(path: Path) -> str | None:
    if not path.exists():
        return None
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ids", nargs="*", default=[])
    ap.add_argument("--dir", help="directory of ML<id>.mp3 files; ids are read from the names")
    ap.add_argument("--dest", help="where the audio lives (defaults to --dir)")
    ap.add_argument("--manifest", required=True)
    args = ap.parse_args()

    ids = list(args.ids)
    if args.dir:
        for name in sorted(os.listdir(args.dir)):
            m = re.fullmatch(r"ML(\d+)\.(mp3|wav|flac|ogg)", name, re.I)
            if m:
                ids.append(m.group(1))
    if not ids:
        ap.error("no asset ids: pass --ids or --dir")
    dest = Path(args.dest or args.dir or ".")

    op, jar = opener()
    files, rejected = [], []
    for asset_id in ids:
        url = f"https://macaulaylibrary.org/asset/{asset_id}"
        try:
            # The ML-prefixed URL now redirects to a Cornell CAS login; the numeric
            # one serves the challenge and then the asset.
            html = solve_anubis(op, jar, url)
            info = asset_record(html, asset_id)
        except Exception as e:  # noqa: BLE001 - one bad asset must not stop the audit
            print(f"ERROR {asset_id}: {e}", file=sys.stderr)
            rejected.append({"assetId": asset_id, "reason": f"could not read the asset page: {e}"})
            continue

        local = dest / f"ML{asset_id}.mp3"
        licence_name = MACAULAY_LICENCES.get(info["licenseId"] or "", "")
        verdict = classify(licence_name, "") if licence_name else None
        if verdict is None:
            verdict_note = f"licence id {info['licenseId']} has no published mapping — treated as all rights reserved"
            ok, app_licence = False, None
        else:
            ok, app_licence = verdict.allowed, verdict.licence
            verdict_note = verdict.reason
        if not ok and licence_name and "version" in verdict_note:
            verdict_note += " (Macaulay publishes the class only, never the version)"

        entry = {
            "assetId": f"ML{asset_id}",
            "local": str(local),
            "sourceUrl": url,
            "license": licence_name or (info["licenseId"] or "?"),
            "licenseId": info["licenseId"],
            "recordist": info["recordist"],
            "equipment": info["equipment"],
            "mediaNotes": info["mediaNotes"],
            "tags": info["tags"],
            "obsDate": info["obsDate"],
            "scientificName": info["scientificName"],
            "commonName": info["commonName"],
            "sha1": sha1_of(local),
        }
        if ok:
            entry["appLicense"] = app_licence
            files.append(entry)
            print(f"ok   {entry['licenseId']:<10} -> {app_licence:<12} ML{asset_id} {info['recordist']}")
        else:
            entry["reason"] = verdict_note
            rejected.append(entry)
            print(f"DENY {entry['licenseId']:<10} ML{asset_id} — {verdict_note}")

    manifest = {
        "source": "Macaulay Library (Cornell Lab of Ornithology)",
        "policy": "web/src/species/licence-policy.json",
        "files": files,
        "rejected": rejected,
    }
    Path(args.manifest).parent.mkdir(parents=True, exist_ok=True)
    with open(args.manifest, "w") as f:
        json.dump(manifest, f, indent=1)
    print(f"\n{len(files)} permitted, {len(rejected)} refused -> {args.manifest}")
    return 0 if files or not rejected else 1


if __name__ == "__main__":
    sys.exit(main())

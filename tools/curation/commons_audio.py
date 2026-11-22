#!/usr/bin/env python3
"""Enumerate candidate audio for a species on Wikimedia Commons.

Prints one row per file: title, licence, recordist, duration, size, sha1, url.
Read-only: nothing is downloaded here.

    python3 commons_audio.py "Turdus migratorius" [--json out.json]
"""

import argparse
import json
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "BirdieCuration/0.1 (offline game asset research; contact: alex)"


def query(term, limit=50):
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f'filetype:audio "{term}"',
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata|sha1",
        "format": "json",
        "formatversion": "2",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def strip_html(s):
    out, skip = [], False
    for ch in s or "":
        if ch == "<":
            skip = True
        elif ch == ">":
            skip = False
        elif not skip:
            out.append(ch)
    return " ".join("".join(out).replace("&amp;", "&").replace("&quot;", '"').split())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("term")
    ap.add_argument("--json")
    args = ap.parse_args()

    pages = query(args.term).get("query", {}).get("pages", [])
    rows = []
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata", {})
        rows.append(
            {
                "title": p.get("title"),
                "license": (em.get("LicenseShortName") or {}).get("value", "?"),
                "recordist": strip_html((em.get("Artist") or {}).get("value", "?")),
                "description": strip_html((em.get("ImageDescription") or {}).get("value", ""))[:180],
                "duration": (em.get("Duration") or {}).get("value"),
                "size_mb": round(ii.get("size", 0) / 1e6, 2),
                "mime": ii.get("mime"),
                "sha1": ii.get("sha1"),
                "url": ii.get("url", "").split("?")[0],
            }
        )

    rows.sort(key=lambda r: (r["license"], r["title"]))
    if args.json:
        with open(args.json, "w") as f:
            json.dump(rows, f, indent=1)

    print(f"{len(rows)} files for {args.term!r}\n")
    for r in rows:
        secs = f"{float(r['duration']):5.1f}s" if r["duration"] else "   ?  "
        print(f"{secs} {r['size_mb']:7.2f}MB  {r['license']:<16}  {r['recordist'][:26]:<26}  {r['title']}")
        if r["description"]:
            print(f"        {r['description']}")


if __name__ == "__main__":
    sys.exit(main())

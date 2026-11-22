#!/usr/bin/env python3
"""Build an audition pack from a fetch_audio.py manifest.

Two outputs:
  audition/  one normalised MP3 per distinct recording, 60 s max, so a human can
             listen to the whole candidate set in one sitting.
  candidates/  12 s clips cut at the measured average-density window of the few
             recordings that look shippable, so approving a clip and shipping it
             are the same decision.

Duplicates are collapsed by Xeno-canto number (Commons often mirrors one XC
recording twice, as .ogg and .mp3); the .mp3 mirror is preferred because it
carries the recordist's own Type: field in its description.

    python3 make_audition_pack.py --manifest ~/projects/birdie-curation/american-robin/manifest.json \
        --dest ~/projects/birdie-curation/american-robin --candidates XC128490:0 XC132864:35.5
"""

import argparse
import json
import os
import re
import subprocess

# Loudness-normalise so a quiet recording and a loud one can be compared by ear.
LOUDNORM = "loudnorm=I=-18:TP=-1.5:LRA=11"


def key_of(entry):
    """Stable identity: the XC number if present, else the filename stem."""
    m = re.search(r"XC(\d+)", entry["title"])
    return ("xc" + m.group(1)) if m else os.path.basename(entry["local"]).rsplit(".", 1)[0].lower()


def transcode(src, dst, start=None, length=None, normalise=True):
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if start is not None:
        cmd += ["-ss", str(start)]
    cmd += ["-i", src]
    if length is not None:
        cmd += ["-t", str(length)]
    if normalise:
        cmd += ["-af", LOUDNORM]
    cmd += ["-ac", "1", "-ar", "32000", "-codec:a", "libmp3lame", "-b:a", "96k", dst]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--dest", required=True)
    ap.add_argument("--candidates", nargs="*", default=[], metavar="XCnnn:START")
    args = ap.parse_args()

    data = json.load(open(args.manifest))
    seen, distinct = set(), []
    for e in sorted(data["files"], key=lambda e: e["title"]):
        k = key_of(e)
        if k in seen:
            continue
        seen.add(k)
        distinct.append(e)

    aud = os.path.join(args.dest, "audition")
    os.makedirs(aud, exist_ok=True)
    out = []
    for i, e in enumerate(distinct, 1):
        aid = f"A{i:02d}"
        dur = e["durationSeconds"] or 0
        start = None if dur <= 60 else round(dur * 0.25, 1)
        dst = os.path.join(aud, f"{aid}-{key_of(e)}.mp3")
        transcode(e["local"], dst, start=start, length=None if dur <= 60 else 60)
        out.append({**e, "auditionId": aid, "auditionFile": dst,
                    "auditionFrom": start or 0.0,
                    "auditionLength": dur if dur <= 60 else 60})
        print(f"{aid}  {dur:7.1f}s  from {str(start or 0):>6}s  {e['title'][5:]}")

    cand_dir = os.path.join(args.dest, "candidates")
    os.makedirs(cand_dir, exist_ok=True)
    for spec in args.candidates:
        xc, start = spec.split(":")
        match = next((e for e in distinct if xc in e["title"]), None)
        if not match:
            print(f"! no recording matching XC{xc}")
            continue
        dst = os.path.join(cand_dir, f"{xc}-from{float(start):.1f}s-12s.mp3")
        transcode(match["local"], dst, start=float(start), length=12)
        print(f"candidate  {os.path.basename(dst)}")

    json.dump(out, open(os.path.join(args.dest, "audition-index.json"), "w"), indent=1)
    print(f"\n{len(out)} audition files -> {aud}")


if __name__ == "__main__":
    main()

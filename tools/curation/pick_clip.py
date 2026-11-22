#!/usr/bin/env python3
"""Pick a clip window whose rendered audio actually measures at the stated rate.

Cutting at an "average density" window in the source is not enough: loudness
normalisation moves the measurement threshold, and a phrase straddling the clip
edge is counted by one run and not the other. So render each candidate through
the same pipeline that will ship, measure the rendered file, and choose the
window closest to the target.

    python3 pick_clip.py SOURCE --target-rate 71.5 --out out.mp3 [--length 12] [--step 4]
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
MEASURE = os.path.expanduser(
    "~/.hermes/skills/media/audio-corpus-curation/scripts/measure_cadence.py"
)
LOUDNORM = "loudnorm=I=-18:TP=-1.5:LRA=11"


def duration_of(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", path],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def render(src, dst, start, length):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-i", src, "-t", str(length),
         "-af", LOUDNORM, "-ac", "1", "-ar", "32000",
         "-codec:a", "libmp3lame", "-b:a", "96k", dst],
        check=True,
    )


def measure(path):
    r = subprocess.run(["python3", MEASURE, path, "--json"], capture_output=True, text=True)
    if r.returncode != 0:
        return None
    j = json.loads(r.stdout)
    return j["phrases"], j["rate_per_minute_over_span"], j["active_span"]["seconds"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--target-rate", type=float, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--length", type=float, default=12.0)
    ap.add_argument("--step", type=float, default=4.0)
    args = ap.parse_args()

    total = duration_of(args.source)
    starts = []
    s = 0.0
    while s + args.length <= total:
        starts.append(round(s, 2))
        s += args.step

    rows = []
    with tempfile.TemporaryDirectory() as tmp:
        for start in starts:
            tmp_clip = os.path.join(tmp, "candidate.mp3")
            render(args.source, tmp_clip, start, args.length)
            m = measure(tmp_clip)
            if m:
                rows.append((start, *m))
            if not rows or rows[-1][0] != start:
                print(f"  (no phrases in window at {start}s)", file=sys.stderr)

    if not rows:
        raise SystemExit("no candidate window produced measurable audio")

    best = min(rows, key=lambda r: abs(r[2] - args.target_rate))
    print(f"source {os.path.basename(args.source)}  target {args.target_rate}/min")
    print("  start   phrases   rate/min   span")
    for start, phrases, rate, span in sorted(rows, key=lambda r: r[2]):
        mark = "  <- chosen" if start == best[0] else ""
        print(f"  {start:6.1f}  {phrases:7d}  {rate:9.1f}  {span:5.1f}s{mark}")

    render(args.source, args.out, best[0], args.length)
    print(f"\nwrote {args.out} (from {best[0]}s, {best[1]} phrases, {best[2]}/min)")


if __name__ == "__main__":
    main()

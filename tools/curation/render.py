#!/usr/bin/env python3
"""The one render chain for a clip that ships.

`pick_clip.py` used to audition windows through a loudness-normalised chain while
`prepare-audio.sh` shipped an untreated cut, so the window was chosen by measuring
an artefact that never shipped (issue #2). Both now call this module: the chain
lives here once, and the build echoes it.

The chain also does the two things #1 asks for: a 150 Hz high-pass removes the
low-frequency rumble that dominated the robin clip, and loudness normalisation to
-18 LUFS brings the bird up to a sane phone-speaker level. The build prints the
share of power left below 200 Hz so a future recording cannot slip through with
the same defect.

    python3 tools/curation/render.py SOURCE --out OUT.mp3 --start 0 --length 10
    python3 tools/curation/render.py SOURCE --out OUT.mp3 --length 12 --report

Standard library plus ffmpeg, like the other curation tools; no numpy.
"""

from __future__ import annotations

import argparse
import array
import math
import subprocess
import sys
from pathlib import Path

CHAIN = "highpass=f=150:poles=2,loudnorm=I=-18:TP=-1.5:LRA=11"


def render(src: Path | str, dst: Path | str, start: float, length: float) -> None:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(length),
         "-i", str(src), "-af", CHAIN, "-ac", "1", "-ar", "32000",
         "-codec:a", "libmp3lame", "-b:a", "96k", str(dst)],
        check=True,
    )


def _pcm(path: Path | str, af: str | None = None) -> array.array:
    cmd = ["ffmpeg", "-v", "error", "-i", str(path)]
    if af:
        cmd += ["-af", af]
    cmd += ["-f", "s16le", "-ac", "1", "-ar", "16000", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    pcm = array.array("h")
    pcm.frombytes(raw)
    return pcm


def _power(samples: array.array) -> float:
    return sum(x * x for x in samples) / max(1, len(samples))


def band_share(path: Path | str, cutoff_hz: int = 200) -> tuple[float, float]:
    """Return (percent of power below the cutoff, that share in dB)."""
    full = _power(_pcm(path))
    low = _power(_pcm(path, f"lowpass=f={cutoff_hz}"))
    if full <= 0:
        return 0.0, -math.inf
    return 100.0 * low / full, 10.0 * math.log10(low / full)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--length", type=float, required=True)
    ap.add_argument("--report", action="store_true", help="print chain, duration and band share")
    args = ap.parse_args()

    render(args.source, args.out, args.start, args.length)
    if args.report:
        share, db = band_share(args.out)
        duration = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(args.out)],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        print(f"rendered {args.out}")
        print(f"  chain    {CHAIN}")
        print(f"  duration {duration} s")
        print(f"  <200 Hz  {share:.2f}% of power ({db:.1f} dB rel. total)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

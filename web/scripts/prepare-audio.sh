#!/usr/bin/env bash
# Birdie — audio preparation.
#
# Rebuilds the clips in public/audio/ from the original recordings, so every
# shipped second of bird sound is reproducible and traceable. Run from web/:
#
#     bash scripts/prepare-audio.sh
#
# Each block records: the source URL, the exact SHA-256 of the download we used,
# the trim points, and why. If a hash does not match, the file changed upstream —
# stop and re-measure rather than silently shipping different audio, because the
# cadence figures in species/records/*.ts were counted from the file below.

set -euo pipefail

WORK="${WORK:-${TMPDIR:-/tmp}/birdie-audio}"
mkdir -p "$WORK"
OUT="public/audio/american-robin"
mkdir -p "$OUT"

fetch() { # url dest expected_sha256
  local url="$1" dest="$2" want="$3"
  if [ ! -f "$dest" ]; then
    echo "fetching $(basename "$dest")"
    curl -sL --fail -o "$dest" "$url"
  fi
  local got
  got="$(sha256sum "$dest" | cut -d' ' -f1)"
  if [ "$got" != "$want" ]; then
    echo "CHECKSUM MISMATCH for $dest" >&2
    echo "  expected $want" >&2
    echo "  got      $got" >&2
    exit 1
  fi
  echo "ok $(basename "$dest")"
}

# ---------------------------------------------------------------------------
# 1. The carol. Source: G. McGrane, "American Robin", 46.16 s, public domain.
#    Cadence in records/american-robin.ts is counted from THIS file:
#    43 phrases over 38.1 s of continuous song (file opens with ~8 s of silence).
#    Shipped clip: 23.5 s + 12 s — a window at average phrase density (70/min),
#    chosen so the clip does not sound busier than the record claims.
# ---------------------------------------------------------------------------
SRC1="$WORK/American_Robin.ogg"
fetch "https://upload.wikimedia.org/wikipedia/commons/4/4e/American_Robin.ogg" \
      "$SRC1" "e3cf54141471fdc91745dd1979abc113157ba60a6e52880a21093c70fe6f0c4d"

ffmpeg -v error -y -ss 23.5 -t 12 -i "$SRC1" \
  -ac 1 -ar 32000 -codec:a libmp3lame -b:a 96k \
  "$OUT/pillar-carol-01.mp3"
echo "built $OUT/pillar-carol-01.mp3"

# ---------------------------------------------------------------------------
# Pending audition — located but NOT shipped, because classifying them as song
# or call requires a human ear (see `provisional` in the robin record):
#   NPS Yellowstone           3.47 s  fef47c8ac12f879335d67a96dbb8752ebae49a2fbeb6927efdd5a00efb8c27d2
#   NPS & MSU Acoustic Atlas 36.94 s  7a2700bbe2233505ccf592e9e06a4b196a0feb4d2d7a4773ed5f2f110696a001
# ---------------------------------------------------------------------------

echo
echo "verifying output:"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/pillar-carol-01.mp3" | sed 's/^/  duration /'
ls -l "$OUT" | sed 's/^/  /'

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
# stop and re-run the checks rather than silently shipping different audio, because
# the record's provenance and the species verdict are tied to these exact bytes.

set -euo pipefail

WORK="${WORK:-${TMPDIR:-/tmp}/birdie-audio}"
mkdir -p "$WORK"
OUT="public/audio/american-robin"
mkdir -p "$OUT"

# Every fetch must declare its licence, and the licence must be permitted by
# web/src/species/licence-policy.json. This is the last gate before bytes land in
# the build: NC or ND (or an unrecognised name) stops here and not in review.
licence_ok() { # licence-name licence-url
  python3 ../tools/curation/licence.py --classify "$1" --url "$2" || {
    echo "REFUSED: $1 is not a licence Birdie may ship (see web/src/species/licence-policy.json)" >&2
    exit 1
  }
}

fetch() { # url dest expected_sha256 licence-name licence-url
  local url="$1" dest="$2" want="$3"
  licence_ok "${4:?licence name required}" "${5:?licence url required}"

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
# 1. The carol. Source: Doug Hynes, "American Robin" XC570791, 43.78 s,
#    CC BY-SA 4.0, Goulds, Newfoundland and Labrador — adult male, song.
#
#    Replaces G. McGrane's public-domain "American Robin", withdrawn 2026-11-22:
#    its first 33 s is Hermit Thrush (auditioned by ear; BirdNET v3 returns
#    Hermit Thrush at 0.87-0.93 across eleven consecutive windows, with American
#    Robin at 0.81 only at 42 s of 46 s). The 67.7 phrases/min counted from that
#    file, and every clip cut from it, was a thrush.
#    Withdrawn source, kept for the record: American_Robin.ogg,
#    sha256 e3cf54141471fdc91745dd1979abc113157ba60a6e52880a21093c70fe6f0c4d.
#
#    Shipped clip: 0.0 s + 10 s. The opening stretch is one clean robin; the
#    recording turns mixed after ~10 s (Yellow-rumped Warbler, crows), so the
#    clip stops there. The recordist labels the file "adult, male, song"; the
#    record's dawn figure is Johnson's published floor, and no count from this
#    window is used as a rate. BirdNET re-checked the clipped bytes on 2026-11-23:
#    American Robin in 3 of 3 complete windows
#    (docs/curation/species-checks.json).
# ---------------------------------------------------------------------------
SRC1="$WORK/Turdus_migratorius_-_American_Robin_XC570791.mp3"
fetch "https://upload.wikimedia.org/wikipedia/commons/1/16/Turdus_migratorius_-_American_Robin_XC570791.mp3" \
      "$SRC1" "ce85004ba336e224a51e348754e854bab5c3341ccb049e9751ab9a61f1b2abff" \
      "CC BY-SA 4.0" "https://creativecommons.org/licenses/by-sa/4.0/"

ffmpeg -v error -y -ss 0 -t 10 -i "$SRC1" \
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

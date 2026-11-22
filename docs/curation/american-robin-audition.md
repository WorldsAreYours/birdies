# Robin audition sheet

Everything here is ear work, which is why it is a separate session: the record's
rule is that a machine may measure a rhythm but may not decide what a sound *is*.

**Where the audio is** (outside the repo, nothing committed):

```
~/projects/birdie-curation/american-robin/
  audition/A01…A22-*.mp3     22 distinct recordings, 13.8 min total, normalised to -18 LUFS
  candidates/*.mp3           three 12 s clips already cut at measured average-density windows
  manifest.json              licence, recordist, source URL, SHA1 per file
```

Normalised to matched loudness, mono, 32 kHz — so differences you hear are the
birds, not the levels. Any player will do; `mpv A09*` or copy the folder to a
phone.

## Pass 1 — five minutes, seven files

If you only do one pass, do this one. It decides what the robin ships with.

| File | Listen for | Answer |
|---|---|---|
| `A09-xc128490.mp3` (excerpt from 1:50 of 7:21) | "before dawn", one male in a maple. Is it one bird? Is it continuous carol or bouts? | 1 or >1 bird? | 
| `A10-xc129105.mp3` (from 0:38) | recorded as "mostly hissely phrases", top of a 10 m spruce. Do the phrases sound buzzy/wide-band rather than clear whistles? | hisselly? y/n |
| `A08-xc75499.mp3` (whole, 0:29) | "whispery song" after the recordist approached. Is the quiet, complex delivery clearly different from A09? | distinct enough to ship as its own variant? |
| `A13-xc132864.mp3` (from 0:52) | "just before sundown", 15 m up a spruce. Is this song, calls, or both? | song / call / both |
| `A20-xc570791.mp3` (whole, 0:43) | adult male, Newfoundland — a different region. Does it read as the same species' carol? | ship as a second dawn male? |
| `A06-xc112597.mp3` (whole, 0:10) | labelled "flight call" | does it match what you'd call a flight call? |
| `A19-xc569292.mp3` (whole, 0:59) | "multiple robins calling to each other", on a wire | which call type(s)? |

## Pass 2 — the rest of the calls

Only if Pass 1 leaves you wanting: `A05` (sidewalk call), `A07`, `A11` (200-bird
berry flock — not a cadence source), `A12` (calls at dawn on a fence), `A14`
(chase calls), `A16`/`A17` (dusk, ponderosa pines), `A22` (NPS "cri").

The specific gap: **no source I read names the robin's call types.** I have
"calls used for communicating specific information, such as when a ground
predator approaches and when a nest or another robin is being directly
threatened" (Wikipedia) and nothing better. So the call taxonomy is yours to
supply — `tut`/`peek`/`whinny`/whatever the midwest actually says — and I will
not write a name I cannot source.

## Pass 3 — approve the clips

Predicate: a shipped clip should sit at *average* density for its period, or the
audio will sound busier than the cadence figure claims. These three were chosen by
rendering many windows through the shipping pipeline and keeping the one whose
rendered audio measured closest to the parent recording — the first attempt (cut
at a source-space average window) came out 75–80/min and was thrown away.

| Candidate | Cut from | Rendered measurement | Parent recording |
|---|---|---|---|
| `robin-dawn-xc128490-from344.0s-12s.mp3` | 344.0 s of A09 | 14 bursts = 71.6/min | 71.5/min |
| `robin-dusk-xc132864-from164.0s-12s.mp3` | 164.0 s of A13 | 8 bursts = 41.6/min | 43.0/min |
| `robin-hisselly-xc129105-from36.0s-12s.mp3` | 36.0 s of A10 | 12 bursts = 65.0/min | 64.5/min |

Approve, or give me a start time and I will re-cut and re-measure — the point of
`pick_clip.py` is that the number survives the re-cut.

## What I do with your answers

- Song/whisper/hisselly confirmed → those become named `songs` variants with
  `songTypeName`, `recordist`, licence and trim points; `repertoire.shipped`
  rises; `verified` can move to true only when every remaining claim has a
  citation.
- One bird confirmed on A09 → the dawn figure is no longer caveated for
  multi-individual, and 71.5/min over 7 min 21 s becomes the record's dawn rate
  instead of 67.7/min over 38 s.
- A04 confirmed as multi-bird → it should stop being the shipped dawn clip even
  though it is the licence-cleanest one.
- Call names → `calls[]` stops being empty.

Anything you cannot tell from a 60 s excerpt is a legitimate "can't say", and
gets recorded as such rather than averaged into a guess.

## Findings (fill in, or tell me and I will)

```
A09 one bird?          :
A10 hisselly?          :
A08 ship as variant?   :
A13 song/call/both     :
A20 second male?       :
A06 flight call?       :
A19 call type(s)       :
candidate clips        :
call taxonomy          :
```

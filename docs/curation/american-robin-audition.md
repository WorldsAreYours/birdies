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

If you have no shell on the host, the same audio is mirrored on the temporary
branch `tmp/robin-audition` — open that branch, then "Code → Download ZIP". The
files that still need an ear are in `tmp/robin-audition/review/`, with the
questions in `review/README.txt`; the full set stays in `audition/` and
`candidates/` for pass 2 and provenance. That branch is disposable: delete it once the answers
below are recorded.

## Pass 1 — five minutes, seven files

Answered 2026-11-22; kept as the record of what each file was asked to settle.
Rows are in file order, which is also how the folder sorts.

| File | Listen for | Question asked |
|---|---|---|
| `A06-xc112597.mp3` (whole, 0:10) | labelled "flight call" | does it match what you'd call a flight call? |
| `A08-xc75499.mp3` (whole, 0:29) | "whispery song" after the recordist approached. Is the quiet, complex delivery clearly different from A09? | distinct enough to ship as its own variant? |
| `A09-xc128490.mp3` (excerpt from 1:50 of 7:21) | "before dawn", one male in a maple. Is it one bird? Is it continuous carol or bouts? | 1 or >1 bird? |
| `A10-xc129105.mp3` (from 0:38) | recorded as "mostly hissely phrases", top of a 10 m spruce. Do the phrases sound buzzy/wide-band rather than clear whistles? | hisselly? y/n |
| `A13-xc132864.mp3` (from 0:52) | "just before sundown", 15 m up a spruce. Is this song, calls, or both? | song / call / both |
| `A19-xc569292.mp3` (whole, 0:59) | "multiple robins calling to each other", on a wire | which call type(s)? |
| `A20-xc570791.mp3` (whole, 0:43) | adult male, Newfoundland — a different region. Does it read as the same species' carol? | ship as a second dawn male? |

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

## Answers — 2026-11-22, by ear

| File | Heard | Consequence |
|---|---|---|
| `A06` | a call, surrounded by a lot of white noise | a call is present; the "flight call" label is not confirmed. Unusable as game audio. No name recorded. |
| `A08` | robin, cardinal and red-winged blackbird | rejected as a whisper-song variant — not a solo robin. |
| `A09` | one prominent robin, other robins audible behind it | one bird for the shape of the delivery, not for the count: 71.5/min is a chorus rate and an upper bound for a single male. |
| `A10` | blackbird and robin | hissellly attribution unsafe — the buzz may be the blackbird. Variant blocked, and so is its candidate clip. |
| `A13` | clean and prominent, just one robin | single bird confirmed. Song vs call: **can't say** — not separable by ear on this file, so 43/min is carried as a declared simplification, not a song count. |
| `A19` | prominent robin, plus a blue jay | calls are there, mixed with another species. Still no call name. |
| `A20` | just a robin | approved as the second dawn voice: different region, nothing else in the file. |

Still open:

- **A04** — heard on 2026-11-22: the robin only becomes audible around 42 s of the
  46 s file, and what it does there is the loudest call in the recording. Before
  that, less prominent bird sounds that the listener did not attribute to the
  robin. Two things follow, and the second is not a question but a defect:

  1. The 67.7/min dawn figure was counted over 0–38 s of this file. If the earlier
     pulses are another species, that figure is a measurement of the wrong animal
     and has to be withdrawn; if they are robins at a distance, it survives as a
     chorus figure. **This is the open question.**
  2. The shipped 12 s excerpt sits at 23.5–35.5 s of A04, which is entirely inside
     the region before the robin arrives. There are only ~4 s of robin in the file,
     so no 12 s excerpt cut from A04 can be mostly robin — the shipped clip has to
     come from another recording whatever the answer above is.

  **Settled.** BirdNET confirms the ear (section below), and on the strength of it
  the shipped clip is now the first 10 s of `A20` — the part the listener called
  "very robin focused" — with the mixed tail left out. Dawn was later anchored on
  Johnson's published floor; the 51.2/min count referred to here was withdrawn.
  This bullet stays as the record of why.

  A20 was the replacement and shipped as the first dawn voice on 2026-11-22. The
  12 s cut in the review folder (`A20-candidate-dawn-12s.mp3`) was the approval
  copy; its 51.1/min measurement belongs to the retired counting, not the claim.
- **The three candidate clips** — approve, or give a start time.

## Machine check — BirdNET, 2026-11-22

The ear question ("is the pulsing before 42 s in A04 a robin?") was put to a
classifier as a second opinion, because band energy could not separate the two.

Tool: the official Cornell library `birdnet` 1.5.1 (`birdnet-team/birdnet`),
acoustic model **v3.0**, ONNX FP32 backend, 3 s windows, min confidence 0.05,
location/date prior 35.5 N, -78.5 W, 15 April (the source note says North
Carolina; the date is a guess, and only prunes the species shortlist — American
Robin is in it either way). Install was `pip install birdnet` in a clean venv; no
TensorFlow, no numpy pin. The third-party `birdnetlib` was tried first and works
too, but needs `numpy<2`, `librosa` and `resampy` to read an MP3, and only drives
the older V2.4 TFLite model — use the official package.

| Recording | Windows | What it says |
|---|---|---|
| `A04` (withdrawn source) | 16 | Hermit Thrush 0.87–0.93 in 11 of 16 windows, i.e. 0–31 s. American Robin 0.81 in exactly one window, at 42 s. |
| `pillar-carol-01.mp3` (what ships, rebuilt from A20) | 4 | 2026-11-23, threshold 0.1: American Robin 0.715 / 0.849 / 0.763 in 3 of 3 complete windows; the 1 s tail scores 0.023. The thrush result of 2026-11-22 belongs to the withdrawn A04 clip. |
| `A09-xc128490` | 20 | American Robin 0.73–0.92 in 20 of 20 windows. |
| `A20-xc570791` | 15 | American Robin 0.70–0.89 in 14 of 15 windows. |
| `A20` candidate cut (6.0 s, 12 s) | 4 | American Robin 0.84 in 4 of 4 windows. |

So the ear and the model agree: the "continuous carol" that the 67.7/min figure
was counted from is a Hermit Thrush. That clip was replaced on 2026-11-22 with the
first 10 s of A20, and the current bytes are checked again in
`docs/curation/species-checks.json`: American Robin in every complete window
(0.715–0.849), bound to the file's SHA-256.

What this does **not** establish: BirdNET reports species presence per 3 s
window, not individuals, and it cannot decide song vs call. Its confidence is
evidence, not ground truth — but 0.87–0.93 across eleven consecutive windows,
against 0.81 in a single window that the human ear independently placed at 42 s,
is not a marginal call. Both readings would have to be wrong in the same
direction.

Consequences recorded in the species record rather than here: the dawn figure is
Johnson's published floor rather than the withdrawn count, and the shipped clip is
the A20 opening. Further replacement is a product decision, not a curation one.

## What the answers changed

- **Dawn moved off the A04 count.** The 67.7/min belongs to a Hermit Thrush, so the
  record now carries Johnson's published floor; A09's 71.5/min stays a chorus upper
  bound and corroboration only.
- **No hissellly variant and no whisper variant.** Both source recordings carry
  other species, so `repertoire.shipped` stays at 1.
- **A20 is the one new shippable voice** — a second dawn male with a regional
  accent, which is what D3 (multi-regional or not) was waiting on.
- **Dusk stays at 43/min, as a declared simplification.** A13 was auditioned and the
  listener could not tell song from call, so the file is recorded as "can't say" and
  the figure is a design choice rather than a count. That is the answer the sheet
  exists to make acceptable.
- **`calls[]` stays empty.** Two recordings carry calls; neither carries a name,
  and a name is what the array needs.
- **`verified` stays false**, for the reasons the record lists: the song type is
  unclassified, no call is named, and the dawn attribution is presumed from a
  published floor rather than stated by the recording.

## What this establishes

Anything you cannot tell from a 60 s excerpt is a legitimate "can't say", and gets
recorded as such rather than averaged into a guess. The plan this sheet was written
against — A09 as the dawn rate, A04 as the shipped clip, 67.7/min as the figure —
was superseded by the answers above: A09 is a chorus, A04 is a thrush, and the
record now uses Johnson's published floor with A20 as the shipped voice.

## Findings (fill in, or tell me and I will)

```
A09 one bird?          : one prominent, others audible behind it — 71.5/min is a
                         chorus rate, not a single male's
A10 hisselly?          : no — a blackbird is in the file, so the buzz is not
                         attributable to the robin
A08 ship as variant?   : no — cardinal and red-winged blackbird present
A13 song/call/both     : can't say — clean, one robin; song and call not
                         separable by ear on this file
A20 second male?       : yes — robin only, different region
A06 flight call?       : a call, yes; white noise throughout, label unconfirmed
A19 call type(s)       : none named — robin under a blue jay
candidate clips        : open — dawn, dusk, hissellly
call taxonomy          : nothing named; calls[] stays empty
```

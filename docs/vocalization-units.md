# Vocalization units — the Birdie standard

Version 1.0, 2026-11-22. This is normative for species records, curation measurements
and anything that schedules audio. It exists because "song" was being used for three
different things: a functional category, a structural group of elements, and a count of
energy bursts. The fix is to name the unit every time a number is written down.

---

## 1. What the existing tools actually count

None of the platforms Birdie might borrow a convention from measures elements or songs.
They operate one level up or one level down.

| tool | what it outputs | its unit | what it does not do |
|---|---|---|---|
| Merlin Sound ID | real-time species suggestions from recorded audio, matched against likely local birds; trained on Macaulay Library recordings, minimum 150 recordings per species | one species suggestion per audio window | no element or song count; no song-vs-call output |
| eBird | a checklist: species, count of individuals, effort, location, behaviour/breeding codes | one individual bird per checklist (report the highest number seen at once) | no vocalization rate; "singing" is an attribute of the observation, not a count |
| Macaulay Library | media archive with sound tags | a functional *type* tag: Song, Dawn song, Flight song, Duet, Call, Flight call, Mechanical sound | no structural units, no rate |
| BirdNET v3 | species per 3 s segment with a confidence; 32 kHz input, 15 kHz ceiling, 1280-dimensional embeddings, 11,725 classes | one 3 s segment | no song-vs-call, no element count, no individuals |
| Xeno-canto | recording plus the recordist's `Type:` label (song, call, flight call, …) | a human-assigned type label | no standard unit definition; labels vary by recordist |

The useful part of Macaulay's vocabulary is that it defines *function*, not structure:
Song is "vocalization used for territorial advertisement or mate attraction"; Call is
"any vocalization that doesn't qualify as song"; Dawn song and Flight song are context
tags. That is the right vocabulary for "what kind of sound is this", and the wrong one
for "how many per minute". Birdie needs both, kept apart.

Merlin and BirdNET are species detectors. eBird is an individual-count database. None of
them can tell you that a robin sang 73 elements a minute, because none of them defines an
element. A standard therefore has to be Birdie's, and it has to say how it maps back to
the labels those tools do use.

---

## 2. The four structural units

These are defined for the American Robin from Johnson (2006, p. 342), and the same shape
generalises to other songbirds with species-specific parameters. The numbers in brackets
are the robin defaults; every species record must state its own.

**Note** — one continuous mark on a spectrogram. Notes inside an element are separated by
very short gaps (10–125 ms in the robin). Notes are descriptive only; Birdie does not
count them.

**Element** — one or more notes forming the smallest unit a listener would call a sound:
the "cheerily" in "cheerily, cheer-up, cheerio". Robin elements run 150–350 ms, and the
gap between two elements is 250–2000 ms. **The element is the smallest unit the envelope
counter can measure.** A 120 ms merge gap sits on the note/element boundary, so the
counter's output is an element count.

**Song** — one rendition of the species' song: a stereotyped sequence of elements. In the
robin, groups are typically 3–8 elements. The boundary is a gap of at least 2 s (the top
of Johnson's between-element range), or a change in the element sequence that makes the
rendition a different song. That boundary is a Birdie convention, not a published
universal; a song claim must say which definition it used. **A song is not something the
envelope can delimit.** It needs a sequence model or a human annotator.

**Bout** — a continuous singing period. Birdie uses a gap of at least 30 s without song as
the bout boundary. This is a scheduling convention, not a biological universal; it exists
so a clip can represent "one visit to the perch" rather than one element.

Calls are a **type**, not a structural unit. If a call needs a rate, count its elements or
define a call unit explicitly; do not reuse the song definition.

---

## 3. Rate definitions

A rate is a count divided by the minutes of *active span*, never the file length. It is
only meaningful with the unit attached.

**Element rate** — `elements per minute`. Machine-measured. The measurement protocol is:

1. Decode to mono PCM.
2. Band-limit to the species' vocal band (robin: 150 Hz–5 kHz for whistle song; 1–7 kHz if
   hisselly material is included).
3. RMS envelope, 25 ms frames.
4. Threshold at `P10 + 0.35 × (P95 − P10)` of that file's frame levels.
5. Merge gaps ≤ 120 ms (notes inside an element); discard runs under 60 ms.
6. Count units over the first onset–last offset span; report count, span, band, and all
   detector parameters.

An element rate is only `measured` after the detector has been validated against a
hand-annotated sample and the note carries the precision/recall and the parameter range.
Before that it is `counted`, and the record must say so.

**Song rate** — `songs per minute`. Human-annotated or published. To annotate:

1. Display the recording as a spectrogram with a 2 s grid.
2. Mark the first element of a rendition and the last element before a gap ≥ 2 s or a
   change in the element sequence.
3. Count songs and divide by the active span. Record the annotator and the definition used.

Do not derive a song rate by dividing an element rate by a guessed group size. If a
derived figure is unavoidable, divide by the *measured* mean elements per song in the same
recording, write the arithmetic in the note, and mark the method `derived`.

**Bout rate** — optional. Same as song rate, with the 30 s bout boundary stated.

---

## 4. Data model

The standard is small enough to put in the type system.

```ts
export type VocalizationUnit = 'element' | 'song' | 'bout';
export type ClipUnit = VocalizationUnit | 'excerpt';

/** Functional type, aligned with Macaulay Library's sound tags. */
export type VocalizationType =
  | 'song' | 'dawn-song' | 'flight-song' | 'duet'
  | 'call' | 'flight-call' | 'mechanical';

export interface CadenceClaim {
  readonly perMinute: number;
  readonly unit: VocalizationUnit;
  readonly method: 'measured' | 'published' | 'annotated' | 'derived' | 'simplified';
  readonly citationId: string | null;
  readonly note: string;
  /** Required when method is 'measured'. */
  readonly detector?: {
    readonly bandHz: readonly [number, number];
    readonly frameMs: number;
    readonly thresholdFraction: number;
    readonly mergeGapMs: number;
    readonly minDurationMs: number;
    readonly validation: string;
  };
  /** Required when method is 'annotated'. */
  readonly annotation?: {
    readonly file: string;
    readonly annotator: string;
    readonly definition: string;
  };
  /** Required when method is 'derived'. */
  readonly derivation?: string;
}

export interface SongVariant {
  /** What the clip contains: one element, one song, one bout, or an excerpt. */
  readonly clipUnit: ClipUnit;
  // ... existing fields
}
```

Rules, enforced by `validateRecord` and by the scheduler:

1. **Unit match.** A scheduling event carries the unit of the cadence claim. A clip may
   only serve an event of the same `clipUnit`.
2. **Excerpts are not schedulable.** `clipUnit: 'excerpt'` marks a clip that contains
   several units (the current 10 s robin clip contains seven elements). It can be
   auditioned or shown in the journal; it cannot stand in for one element.
3. **No silent overlap.** When `clipUnit === unit`, require
   `durationSeconds × perMinute / 60 ≤ 1` (the clip finishes before the next event
   starts). If a bird genuinely overlaps itself, that is a separate, explicit choice.
4. **A song claim needs a definition.** `unit: 'song'` requires a `citationId` or an
   `annotation` with the boundary definition. An envelope count cannot support it.
5. **An element claim needs a detector.** `unit: 'element'` and `method: 'measured'`
   require the `detector` block and a validation reference.
6. **No silent conversion.** `method: 'derived'` requires `derivation` text showing the
   arithmetic and the measured quantity it started from.
7. **Verified means complete.** A `verified: true` record needs a count, span, unit and
   source for every rate, and a matching clip unit for every variant the scheduler uses.

---

## 5. Worked examples

### A20 — XC570791 (Newfoundland, adult male; mixed after ~10 s)

| figure | value | unit | span | status |
|---|---|---|---|---|
| clean opening | 73.2/min | element | 10 s | best single-male sample |
| whole file | 57.0/min | element | 41.0 s | mixed species after 10 s; not a single-male rate |
| song rate | — | song | — | not measured; needs annotation |
| shipped clip | 7 elements | excerpt | 10.04 s | `clipUnit: 'excerpt'` |

The old 51.2/min is an element count over the mixed span, pulled down by low-frequency
rumble. It is not a song rate and not a clean single-male rate.

### A09 — XC128490 (chorus with one prominent bird)

71.2 elements/min over 440.7 s. A chorus rate and an upper bound on a single male; the
song rate is not measured.

### A valid song claim, for contrast

```
perMinute: 12
unit: 'song'
method: 'annotated'
annotation: { file: '…', annotator: '…', definition: 'gap ≥ 2 s or element-sequence change' }
note: '12 songs over 60 s of active song, annotated on 2026-11-22.'
```

No such figure exists for the robin yet. The point of the standard is that the record
says so instead of promoting an element count into the gap.

---

## 6. Mapping back to the outside world

- **Macaulay / eBird media tags** → Birdie `VocalizationType`. Use `song` for Song,
  `dawn-song` for Dawn song, `flight-song` for Flight song, `duet` for Duet, `call` for
  Call, `flight-call` for Flight call, `mechanical` for Mechanical sound. A recordist's
  `Type:` label is evidence for the type, not for a count.
- **BirdNET detections** → species-presence evidence per 3 s segment. A detection rate is
  segments per minute, not songs per minute; never put it in a cadence field.
- **eBird checklists** → individual counts per checklist. Do not convert an individual
  count into a vocalization rate.
- **Merlin suggestions** → species evidence. Do not count suggestions as songs.

---

## 7. What this changes in the repo

- `CadenceClaim.songsPerMinute` becomes `perMinute` plus `unit`. Every figure in
  `web/src/species/records/american-robin.ts` gets `unit: 'element'` until a song claim
  is annotated.
- `SongVariant` gets `clipUnit`; the shipped 10 s clip is `'excerpt'`.
- `sim/rate.ts` returns the unit with the rate; `sim/simulate.ts` stamps it on each event;
  the audio engine refuses an event whose clip unit does not match.
- `validateRecord` enforces the seven rules above.
- The UI label is derived from the unit: "elements a minute", not "phrases a minute".

The number under review is still #4's decision. This standard only makes the record say
what the number is a number *of*.

---

## 8. Sources

| id | source |
|---|---|
| Johnson 2006 | Johnson, S. L. (2006). Do American Robins acquire songs by both imitating and inventing? *The Wilson Journal of Ornithology* 118(3): 341–352. doi:10.1676/05-048.1 |
| Merlin Sound ID | Cornell Lab, *Sound ID* help article, support.ebird.org/en/support/solutions/articles/48001185783 (read 2026-11-22) |
| eBird counts | Cornell Lab, *How to Count Birds*, support.ebird.org/en/support/solutions/articles/48000838845 (read 2026-11-22) |
| Macaulay tags | Cornell Lab, *Adding data tags to media in the Macaulay Library*, support.ebird.org/en/support/solutions/articles/48001064365 (read 2026-11-22) |
| BirdNET | Kahl et al. (2021), *Ecological Informatics* 61:101236, doi:10.1016/j.ecoinf.2021.101236; `birdnet-team/birdnet` v1.5.1 model class for v3.0 (3 s, 32 kHz, 15 kHz ceiling, 1280-d embeddings) |
| VAR | Pérez-Granados et al. (2019), *Ibis* 161(4):901–907, doi:10.1111/ibi.12728 |

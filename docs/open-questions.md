# Areas for expansion, and what is still open

Two kinds of entry, kept apart on purpose:

- **Expansion** — capability the pipeline could gain. None of it blocks anything today.
- **Open** — something that currently weakens a shipped claim, or that a machine cannot
  settle. These are the ones worth spending a human on.

The list is live: the robin's entry under "open" is what keeps `verified: false` on
`web/src/species/records/american-robin.ts`, and closing them one by one is the path to
turning it true.

Related: `docs/curation/american-robin-audio.md` (provenance, measurements),
`docs/curation/american-robin-audition.md` (ear work and its results),
`docs/birdie-transition-plan.md` (architecture, decisions D1–D10).

**Status lives in the tracker, not here.** The audio-pipeline findings are filed as
GitHub issues under the milestone
[`Audio pipeline audit`](https://github.com/WorldsAreYours/birdies/milestone/1) —
seven findings filed as one issue each, with the evidence and the file:line. The
sections below stay as the narrative: what was measured, why it matters, and the
order I would take it in. Do not restate issue status in this file; it drifts.

---

## 1. Analysis the machine could do and does not yet

Measured on this host, 2026-11-22. Ordered by value per unit of work.

| Axis | State | What it would settle | Cost |
|---|---|---|---|
| Signal-quality gate | **measured, in the skill, not in this repo** | whether a file is usable at all: SNR, noise floor, clipping, where the noise lives (hiss vs rumble) | free — ffmpeg + PCM. Should become `tools/curation/signal_qa.py` |
| Syllable clustering | not built | turns "name the calls in this recording" into "name these 5 clusters"; the finite-ask version of the call taxonomy | ~half a day, librosa + k-means, no labels needed |
| Second species opinion (Perch v2) | not installed | a contested identification, by a model with different training data | TensorFlow (~600 MB); ships in the same `birdnet` package |
| Geo species-presence model | not used | which species are plausible in a yard and season — feeds the five-bird catalogue and seasonal presence | cheap, same package, V3.0 |
| Non-bird content tagging (YAMNet / PANNs) | blocked | speech, music, dogs, rain, engines in a recording | YAMNet's model host 403s from here and Kaggle wants credentials; PANNs pulls ~300 MB from Zenodo |
| Individual count | not possible with current assets | "one bird or several?" — the question that demoted A09's rate | needs source separation (MixIT-style, TensorFlow) or stereo cues; every source we have is mono |
| Song vs call | no model exists | the single most common question in the audition | the recordist's own `Type:` label is the best available signal; beyond that it is structure (unit duration, repetition, bandwidth) and it stays human |

What this means in practice: three of the seven axes are cheap and would remove work from the
human batch. One (song vs call) has no honest machine answer, and saying so is why the record
carries "can't say" rather than a guess.

---

## 2. Pipeline gaps

The pipeline is documented in the `audio-corpus-curation` skill; these are the places where
this repo still does by hand what it should do from data.

- **`web/scripts/prepare-audio.sh` is hand-written per clip.** Adding a bird means editing
  bash, which contradicts the rule that a sixth bird must be a data edit. It should read a
  manifest (source URL, hash, trim points, licence) and build every clip in it.
- **No `CREDITS` / `NOTICE` for the shipped audio.** The shipped clip is now CC BY-SA 4.0
  (Doug Hynes, XC570791). That licence requires attribution and a share-alike notice wherever
  the audio travels, including inside the app bundle. Nothing in the repo or the UI carries
  it today. This is the one compliance gap on this list, and it is small: a data file plus a
  screen or footer.
- **The audition pack is assembled by hand.** `tools/curation/make_audition_pack.py` exists;
  it should emit the `review/` folder and its README from the manifest so the pack cannot
  drift from the corpus.
- **No test guards the licence or the shipped bytes.** `validateRecord` checks that a
  declared duration agrees with its own `clipRange`, but nothing asserts that the file in
  `public/audio/` is actually that long, and nothing asserts that a non-PD licence has a
  matching attribution entry.
- **Four of the five birds have nothing.** Northern Cardinal, Blue Jay,
  Black-capped Chickadee, Mourning Dove: no recordings, no measurements, no records.

---

## 3. Open on the robin record (this is what `verified: false` means)

- **Dawn attribution is presumed, not sourced.** 51.2/min comes from XC570791, whose
  recordist labels it "adult, male, song" — not "dawn". A recording that states dawn, or a
  study that quantifies it for this species at this latitude, closes it. XC128490 does state
  "before dawn" but is a chorus (71.5/min, an upper bound).
- **Morning and midday are declared simplifications.** The shape is sourced (Miller 1958,
  Slagsvold 1996); the magnitudes are not. A quantified study closes both.
- **Dusk is an upper bound.** 43/min counted off a file labelled "call, song", and the
  audition could not separate song from call. Recorded as "can't say", not as a song rate.
- **The shipped clip's song type is unclassified.** One clip ships, called "Song
  (unclassified)". Naming a type is ear work not yet done.
- **`calls[]` is empty.** Two recordings carry calls — A06 under white noise, A19 under a
  blue jay — and neither produced a name. This is what the clustering idea above is for.
- **`repertoire.documented` is a published range (6–25 whistle element types), and the
  hisselly repertoire is unquantified.** Closing it means reading more of Johnson 2006 than
  the introduction.
- **Strata rests on secondary sources.** Birds of North America is paywalled and has not
  been read.
- **`fieldMarks` and `journal.birder` have not been reviewed by a birder.** Both are
  assembled from sources by an agent.

---

## 4. Product and design questions this raised

- **One 10 s clip at 51.2 phrases/min is a scheduling problem.** The simulation asks for
  about one song every 1.2 s; the corpus has one 10 s recording with 7 phrases in it. A yard
  that repeats the same file is the artifact the "never the same variant twice in a row"
  rule exists to prevent, and that rule cannot fix a single-variant problem. Needs either
  more variants per bird or a scheduler that leaves silence.
- **CC BY-SA versus public domain.** The shipped audio is now share-alike where it used to
  be PD. That does not block a paid tier, but it requires the audio to stay open and
  attributed. Hunting a PD/CC0 robin is a later upgrade, not a blocker.
- **Regional accent.** The yard's voice is a Newfoundland male. Whether a Midwest game
  should sound like Newfoundland is a product judgment, not a curation one.
- **Autumn.** `american-robin-audio.md` argues robins sing little in autumn; the record
  currently says `present` for every season, and the cadence table does not distinguish
  singing from presence. Modelled or not?
- **Still open from the plan's decision log:** D7 (what a gift is), D9 (how deep the data
  goes and who verifies it), D10 (whether wrong placement audibly degrades the bird). See
  `docs/birdie-transition-plan.md` §6.

---

## 5. Order I would take them in

1. **CREDITS for the shipped audio** — compliance, small, and it gets worse the longer it
   waits (the clip is already in git history).
2. **`signal_qa.py`**, called from the build — it would have caught A06 before anyone
   listened, and it costs nothing to run.
3. **Manifest-driven audio build**, so birds 2–5 are data edits.
4. **Syllable clustering** when the call vocabulary comes up, because it is the only route
   to `calls[]` that does not involve inventing names.
5. **Perch v2** only if an identification is ever contested. Nothing today is.

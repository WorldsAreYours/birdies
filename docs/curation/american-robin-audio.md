# American Robin — sound curation, session 1

Status: **research complete; audition answered 2026-11-22.** The shipped record
stays `verified: false` for the reasons in §7, not because the audio is unheard.

A file becomes usable in this order: **licence and provenance → the source's
song/call label → signal QA → BirdNET as the last species check.** Counting is not a
step. It was retired after it produced a thrush, a rumble count, and an element
rate labelled as a song rate.

> Terminology: this note predates the unit standard. Where it says "phrases" or
> "bursts", the 120 ms counter is counting *elements* as defined in
> `docs/vocalization-units.md`; "song" is reserved for a group of 3–8 elements.

Session date: 2026-11-22. Species: American Robin, *Turdus migratorius*.
Scope: can we get enough licence-clean robin audio for real song variety, what do
the recordings actually contain, and what cadence figures can be defended.

## 1. Licence picture

Twenty-six files were enumerated on Wikimedia Commons (search by scientific name
and by common name; the scientific name returns the full set) and downloaded.
All 26 matched the SHA1 the Commons API reports for them, so the local copies are
the auditable originals. Four are the same recording mirrored twice (an `.ogg`
plus an XC-tagged `.mp3`), leaving **22 distinct recordings**.

| Licence | Distinct recordings | Notes |
|---|---|---|
| Public domain | 3 | G. McGrane (song, 46 s), NPS Yellowstone (3.5 s), NPS/MSU Acoustic Atlas (call, 37 s) |
| CC BY-SA 3.0 | 10 | nine Xeno-canto mirrors + one 2007 Commons upload (GFDL/CC BY-SA, uploader `Mdf`) |
| CC BY-SA 4.0 | 9 | Xeno-canto mirrors, 2019–2021 |
| CC0 / CC BY / NC / ND | 0 | no plain-attribution tier exists in this set, and nothing here blocks a paid tier |

The table counts distinct recordings (22). By file it is 26: fourteen CC BY-SA 3.0,
nine CC BY-SA 4.0 and three public domain, because four recordings are mirrored
twice (an `.ogg` plus an XC-tagged `.mp3`).

Two consequences worth stating rather than discovering later:

- **Public domain still yields exactly one song.** The "PD-only" policy cannot
  support "several song variants per bird" for the robin. Shipping variety means
  shipping CC BY-SA audio, which obliges the derived clips to stay CC BY-SA and
  obliges a credits screen. That is the D3 decision already taken; this session
  just makes its cost concrete.
- **Attribution is thin on one file.** `Turdus-migratorius-003.ogg` (A21) has no
  recordist in its metadata; the licence template says `{{Self|GFDL|Cc-by-sa-3.0-migrated}}`
  and the uploader is `Mdf`. Attributable as "Mdf (Wikimedia Commons)"; not usable
  if we need a named recordist.

### How the rule is enforced

`web/src/species/licence-policy.json` is the only list of licences Birdie may ship,
and the `License` type derives from it, so a licence cannot be added in one place
only. Three gates read that one file:

- `tools/curation/licence.py` decides **before a download**: `fetch_audio.py` refuses
  a refused licence and records the refusal under `rejected` in the manifest, rather
  than leaving the file silently absent. `--check-manifest` audits a manifest that
  predates the gate; `--stamp-manifest` writes the canonical licence id into each
  entry.
- `web/scripts/prepare-audio.sh` refuses a source whose declared licence is not
  permitted, before `curl` runs.
- `web/src/species/licences.test.ts` fails on a clip whose licence is not permitted or
  whose credit is incomplete, and on audio in `public/audio/` that no record
  declares; `prebuild` fails if `public/audio/CREDITS.txt` no longer matches the
  records.

NC and ND fail closed, and so does an unrecognised string: unknown means
all-rights-reserved until someone proves otherwise.

### Macaulay Library: 14 assets, 4 usable

The Macaulay shortlist was assembled before the gate existed, so it was audited with
`tools/curation/macaulay_assets.py` (2026-11-22; manifest at
`~/projects/birdie-curation/american-robin/macaulay/manifest.json`). The payload
carries `licenseId` alone — `LICENSE<n>` — and the asset page shows no licence
version, no deed URL.

| `licenseId` | assets | verdict |
|---|---|---|
| LICENSE10 (CC0) | 4 — ML163452761, ML550453001, ML56579161, ML57543841 | permitted |
| LICENSE2 | 3 — ML94261, ML168300, ML206448 | no published mapping → all rights reserved |
| LICENSE4 | 2 — ML100124941, ML321642131 | no published mapping → all rights reserved |
| LICENSE5 (CC BY) | 4 — ML618224491, ML619791726, ML631573070, ML635770519 | refused: no published version, so a credit cannot name the licence |
| LICENSE8 (CC BY-NC) | 1 — ML230039991 | refused: non-commercial |

Three consequences worth stating rather than discovering later:

- The three top-rated robin recordings (ML94261, ML168300, ML206448) are
  all-rights-reserved. They were used to check species and density and can never
  ship; anything measured from them is corroboration, not a shippable source.
- Four CC0 assets are the only Macaulay audio usable as-is.
- A Macaulay CC BY clip is not "clean" by default. The licence class is the whole of
  what the archive publishes, so the version would have to be recorded by hand
  before the clip could carry an attribution — which is why the gate refuses it
  instead of guessing.

### Provenance: where each file came from, and what it still needs

The gate answers whether a licence is permitted. It cannot answer whether a *particular*
file is usable, because that depends on facts outside the licence string: the page it came
from, who recorded it, which version of the licence that page names, and whether the bytes
we hold are the bytes the source published. Those facts live in
`docs/curation/audio-sources.json`: one entry per file, with a digest, the licence as
published, and a list of anything still unverified. The masters (~75 MB) stay outside git in
`~/projects/birdie-curation`; the ledger is the versioned half, so a lost disk costs the
audio, not the provenance.

Every file is in one of three states:

- **ready** — permitted licence, the archive's or recordist's song/call label, and
  recordist, source page, licence version (or public-domain basis) and digest are recorded.
  Use is allowed subject to the credit the licence requires; for the shipped clip that
  credit is generated into `CREDITS.txt`.
- **blocked** — the licence *family* is permitted but a named field is missing. The file is
  not usable until someone does that one thing. This is the state that needs a human.
- **refused** — not permitted, unrecognised, or published without a mapping. No amount of
  local work changes that.

What "verified" means depends on the source, and the difference is the point:

- **Wikimedia Commons** publishes a SHA1 per file, so verification there means our copy
  hashes to the published value. All 26 do.
- **Macaulay** publishes neither a digest nor a licence version. Verification there means
  we recorded the SHA-256 of the first download, which can be re-checked but not compared
  against the archive. Its `licenseId` codes also carry no version, so a permitted class is
  still `blocked` until the version is supplied from a deed or from the recordist in writing.
- **Public domain** is not a licence with a deed; it needs a basis (a US federal work, or a
  release by the recordist). The basis is recorded per file rather than assumed.
- **CC BY-SA** puts the obligation on the derivative: the clip we ship must stay CC BY-SA
  and carry the credit. The ledger therefore links every derived file — audition cut,
  ear-review cut, shipped clip — to its source and fails if the licences diverge or a refused
  source has a derivative.

<!-- BEGIN SOURCES TABLE (generated by tools/curation/sources.py --table) -->

| file | type | library | licence | status | what is needed before use |
|---|---|---|---|---|---|
| A01 | — | Wikimedia Commons | cc-by-sa-4.0 | blocked | record the song/call label: neither this file nor another mirror of the same recording carries the recordist's Type: field, so a song or call claim has nothing to cite |
| A02 | — | Wikimedia Commons | cc-by-sa-4.0 | blocked | record the song/call label: neither this file nor another mirror of the same recording carries the recordist's Type: field, so a song or call claim has nothing to cite |
| A03 | — | Wikimedia Commons | public-domain | blocked | record the song/call label: neither this file nor another mirror of the same recording carries the recordist's Type: field, so a song or call claim has nothing to cite |
| A04 | — | Wikimedia Commons | public-domain | blocked | record the song/call label: neither this file nor another mirror of the same recording carries the recordist's Type: field, so a song or call claim has nothing to cite |
| A05 | call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A06 | call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A07 | call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A08 | song (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A09 | song (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A10 | song (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A11 | song, call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A12 | call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A13 | song, call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| A14 | call (Type) | Wikimedia Commons | cc-by-sa-4.0 | ready | none — credit recorded |
| A15 | song, call (Type) | Wikimedia Commons | cc-by-sa-4.0 | ready | none — credit recorded |
| A16 | call (Type) | Wikimedia Commons | cc-by-sa-4.0 | ready | none — credit recorded |
| A17 | call (Type) | Wikimedia Commons | cc-by-sa-4.0 | ready | none — credit recorded |
| A18 | song (Type) | Wikimedia Commons | cc-by-sa-4.0 | ready | none — credit recorded |
| A19 | call (Type) | Wikimedia Commons | cc-by-sa-4.0 | ready | none — credit recorded |
| A20 | song (Type) | Wikimedia Commons | cc-by-sa-4.0 | ready | none — credit recorded |
| A21 | — | Wikimedia Commons | cc-by-sa-3.0 | blocked | name the recordist: the file metadata has no recordist; the uploader is Mdf and the template is {{Self|GFDL|Cc-by-sa-3.0-migrated}}, so either find the original Xeno-canto recordist or credit "Mdf (Wikimedia Commons)"; record the song/call label: neither this file nor another mirror of the same recording carries the recordist's Type: field, so a song or call claim has nothing to cite |
| A22 | — | Wikimedia Commons | public-domain | blocked | record the song/call label: neither this file nor another mirror of the same recording carries the recordist's Type: field, so a song or call claim has nothing to cite |
| ML100124941 | song (tag) | Macaulay Library | LICENSE4 (LICENSE4, no version) | refused | 'LICENSE4' is not a licence the policy recognises |
| ML163452761 | song (tag) | Macaulay Library | cc0 | ready | none — no attribution required |
| ML168300 | song (tag) | Macaulay Library | LICENSE2 (LICENSE2, no version) | refused | 'LICENSE2' is not a licence the policy recognises |
| ML206448 | song (tag) | Macaulay Library | LICENSE2 (LICENSE2, no version) | refused | 'LICENSE2' is not a licence the policy recognises |
| ML230039991 | song (tag) | Macaulay Library | CC BY-NC (LICENSE8, no version) | refused | 'CC BY-NC' is non-commercial |
| ML321642131 | song (tag) | Macaulay Library | LICENSE4 (LICENSE4, no version) | refused | 'LICENSE4' is not a licence the policy recognises |
| ML550453001 | song (tag) | Macaulay Library | cc0 | ready | none — no attribution required |
| ML56579161 | song (tag) | Macaulay Library | cc0 | ready | none — no attribution required |
| ML57543841 | song (tag) | Macaulay Library | cc0 | ready | none — no attribution required |
| ML618224491 | song (tag) | Macaulay Library | CC BY (LICENSE5, no version) | blocked | record the licence version from a deed or written confirmation: the archive publishes the class (LICENSE5) and never the version, so the attribution cannot name the licence it is made under |
| ML619791726 | song (tag) | Macaulay Library | CC BY (LICENSE5, no version) | blocked | record the licence version from a deed or written confirmation: the archive publishes the class (LICENSE5) and never the version, so the attribution cannot name the licence it is made under |
| ML631573070 | song (tag) | Macaulay Library | CC BY (LICENSE5, no version) | blocked | record the licence version from a deed or written confirmation: the archive publishes the class (LICENSE5) and never the version, so the attribution cannot name the licence it is made under |
| ML635770519 | song (tag) | Macaulay Library | CC BY (LICENSE5, no version) | blocked | record the licence version from a deed or written confirmation: the archive publishes the class (LICENSE5) and never the version, so the attribution cannot name the licence it is made under |
| ML94261 | call, song (tag) | Macaulay Library | LICENSE2 (LICENSE2, no version) | refused | 'LICENSE2' is not a licence the policy recognises |
| Turdus migratorius - American Robin XC107523.mp3 | call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| Turdus migratorius - American Robin XC112597.mp3 | call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| Turdus migratorius - American Robin XC75498.mp3 | call (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |
| Turdus migratorius - American Robin XC75499.mp3 | song (Type) | Wikimedia Commons | cc-by-sa-3.0 | ready | none — credit recorded |

<!-- END SOURCES TABLE -->

`python3 tools/curation/sources.py --write` regenerates the ledger from the manifests and
re-hashes every master. `--check` fails if a file changed, a `ready` entry has nothing behind
a required field, a derivative has no source or the wrong licence, any audio file in the
corpus or in `public/audio/` is unaccounted for, or the table above is stale. `--report`
prints the same information with the outstanding act spelled out per file.

Ten files are `blocked`. Six Commons files carry no song/call label anywhere in their
metadata (#21), and A21 among them also has no recordist; four Macaulay CC BY assets have no
published licence version (#19). Nothing else in the corpus needs a human before use.

## 2. What the recordings contain

This is the thing the provisional record said it could not establish without ears. It is
now established *without* ears for sixteen of the twenty-two recordings, because the Commons
mirrors of Xeno-canto files carry the recordist's own `Type:` field — sometimes on a second
mirror of the same recording rather than the audition copy. The other six (A01–A04, A21,
A22) carry no `Type:` anywhere, so the ledger marks them `blocked` and no song or call claim
may cite them. A remark line is quoted below where one exists, but a remark is not a label:

| # | len | licence | XC type | recordist | recordist's own account | phrases | bursts/min |
|---|---|---|---|---|---|---|---|
| A01 | 1.5s | CC BY-SA 4.0 | — | Ryan Hodnett | "in Guelph, Ontario" (no context) | 1 | 104.3 |
| A02 | 9.2s | CC BY-SA 4.0 | — | Ryan Hodnett | "in Guelph/Eramosa, Ontario" (no context) | 9 | 80.0 |
| A03 | 3.5s | PD | — | National Park Service | "an American Robin at Yellowstone" (no context) | 1 | 20.5 |
| A04 | 46.2s | PD | — | G. McGrane | "American Robins recorded in North Carolina" | 43 | 67.7 |
| A05 | 23.3s | CC BY-SA 3.0 | call | J. Jongsma | "Calling from the sidewalk in front of a house" | 24 | 70.4 |
| A06 | 10.8s | CC BY-SA 3.0 | flight call | J. Jongsma | Powderhorn Park, Minneapolis | 9 | 58.2 |
| A07 | 22.8s | CC BY-SA 3.0 | call | J. Jongsma | Wood Lake, Richfield, MN | 13 | 37.3 |
| A08 | 29.5s | CC BY-SA 3.0 | song | J. Jongsma | "singing loudly until I got too close, then … high whispery song" | 29 | 66.2 |
| A09 | 441.6s | CC BY-SA 3.0 | song | J. Jongsma | "Singing before dawn from a maple tree at the edge of a parking lot" | 525 | 71.5 |
| A10 | 154.4s | CC BY-SA 3.0 | song | J. Jongsma | "mostly 'hissely' phrases from the top of a 10m spruce tree" | 164 | 64.5 |
| A11 | 50.5s | CC BY-SA 3.0 | call, song | J. Jongsma | "very large flock (up to 200 birds) feeding on … berries above my head" | 36 | 45.2 |
| A12 | 128.5s | CC BY-SA 3.0 | call | J. Jongsma | "Calls while perched on a fence in a residential yard around dawn" | 106 | 50.5 |
| A13 | 207.6s | CC BY-SA 3.0 | call, song | J. Jongsma | "Singing from 15m up at top of spruce tree … just before sundown" | 144 | 43.0 |
| A14 | 26.4s | CC BY-SA 4.0 | call | J. Jongsma | "group of 5 birds chasing each other in tight formation" | 13 | 40.7 |
| A15 | 133.6s | CC BY-SA 4.0 | call, whisper song | J. Jongsma | "Calls followed by whisper song from top of a leafless tree. Overcast and cold." | 79 | 35.8 |
| A16 | 37.8s | CC BY-SA 4.0 | call | J. Jongsma | "stand of young ponderosa pines at dusk" | 16 | 26.7 |
| A17 | 32.9s | CC BY-SA 4.0 | call | J. Jongsma | same session as A16 | 16 | 30.3 |
| A18 | 33.8s | CC BY-SA 4.0 | juvenile song | radrat | San Francisco Peninsula, bird not seen | 36 | 64.9 |
| A19 | 59.0s | CC BY-SA 4.0 | adult call/song | Eric B | "Multiple robins calling to each other… two on an electrical wire" | 51 | 53.3 |
| A20 | 43.8s | CC BY-SA 4.0 | adult male song | Doug Hynes | Goulds, Newfoundland and Labrador | 35 | 51.2 |
| A21 | 87.9s | CC BY-SA 3.0 | — | `Mdf` (uploader) | "Sandbanks Provincial Park, Ontario, 2007 May" | 93 | 67.0 |
| A22 | 36.9s | PD | — | NPS & MSU Acoustic Atlas | "Cri du Merle d'Amérique" (call) | 6 | 10.4 |

`bursts/min` is the energy-envelope counter from
`~/.hermes/skills/media/audio-corpus-curation/scripts/measure_cadence.py`
(25 ms frames, threshold at 35 % of the file's own dynamic range, gaps under
120 ms merged, bursts under 60 ms discarded), reported over the *active span*.
**The counter is retired from the pipeline.** It is kept here as the record of what it
measured and why each figure was withdrawn; no step in curation or in the game uses it
now. Classification comes from the source's label, and BirdNET is the last species
check before a file is usable.

Coverage now available, by the recordists' own labels:

- **Song, 6 distinct individuals** (A04, A08, A09, A10, A13, A15, A18, A20) —
  including a pre-dawn continuous carol of 7 min 21 s from one male (A09), an
  explicitly *hisselly*-phrase bird (A10), two whisper songs (A08, A15), an
  evening singer (A13), and males from Minnesota, Newfoundland and California.
- **Calls, 8 recordings** (A05, A06, A07, A11, A12, A14, A16/17, A19, A22) —
  contact, flight, flock-chatter, dusk and aerial-chase contexts.
- Songs from a robin population 27° of latitude apart (A18 California, A20
  Newfoundland) — relevant because the species' song varies regionally
  (Wikipedia), so a single-region repertoire would be a quiet inaccuracy.

## 3. Cadence

Two independent dawn measurements now exist, and one published anchor:

| Recording | Context | Span | Bursts/min |
|---|---|---|---|
| A04 McGrane (PD, 46 s) | **withdrawn 2026-11-22** — the first 33 s is Hermit Thrush (ear + BirdNET v3 0.87–0.93); the 67.7/min counted here is a thrush's | 38.1 s | ~~67.7~~ |
| A09 XC128490 (CC BY-SA, 441.6 s) | "before dawn", one bird in a maple tree | 440.7 s | **71.5** |
| A13 XC132864 | "just before sundown", 15 m up a spruce | 200.8 s | **43.0** |
| A12 XC131093 | calls, fence, "around dawn" | 125.8 s | 50.5 (calls) |

Published figure to anchor the dawn rate — Johnson (2006), describing his own
field recordings of 42 males: *"During the robin's pre-dawn chorus, an
individual will typically sing 100 elements in under 100 sec."* That is ≥60
elements/min, of the same order as both measurements. Elements are not the same
unit as the envelope's bursts, so treat it as corroboration, not equivalence.

The shape of the day, from the literature:

- **Dawn is the peak.** Slagsvold (1996): mated males "had a peak song activity
  at dawn but sang little around noon"; the dawn chorus terminated when females
  emerged from the nest.
- **Evening is a real second peak, smaller than dawn.** Miller (1958): robin song
  "occurs, in middle latitudes, intermittently throughout the day, but it is
  maximal in the early dawn, and it reaches a second though lesser peak in the
  evening shortly before the birds go to roost."
- **Song rate is not inflated by noise**, so it is a stable trait rather than a
  response to the moment: in Seger et al. (2011), "neither song length nor rate
  was related to noise level" for robins.

That gives dusk a documented *shape* but not a rate. The record carries 43/min as a
**declared simplification** (single recording, one bird, mixed call and song, so it
cannot be a song count). The old 20/min was no better; what changed is that the shape
is now sourced. Morning and midday stay declared simplifications for the same reason.

## 4. Repertoire — the number the record was missing

The provisional record said no published count of song types could be found. That
was a search failure, not an absence. Johnson (2006), reading the species'
structure directly from recordings:

- Two element categories: **whistle** elements ("generally sound like clear
  whistles, but can blend into buzzes or trills") and **hisselly, or whisper**,
  elements ("generally sung very softly and has a much more complex structure").
- *"Male robins typically have between 6 and 25 whistle elements in their
  repertoires (Sallabanks and James 1999; SLJ unpubl. data)."*
- *"Robins tend to combine both whistle and hisselly elements to form groups
  typically consisting of 3-8 elements."*
- *"Although robins have a larger repertoire of hisselly than whistle elements,
  they typically sing whistle elements 5 to 10 times more frequently than
  hisselly elements."*
- 75–82 % of elements are invented or improvised rather than imitated — the
  species is not a copy-my-neighbour song learner, which is why regional
  variation is real rather than noise.

So the honest statement for the record is "6–25 whistle element types per male,
plus a larger and unquantified hisselly set", not "repertoire unknown". Anything
we ship is a sliver of that; the UI should say so.

Also useful for the audio engine: whistle elements sit roughly 1.5–4 kHz with a
mean frequency range of 1.78 kHz; hisselly elements have a much wider range
(mean 4.74 kHz) and faster frequency modulation. If the strata lowpass is ever
applied per song type, that is the reason the two types degrade differently.

## 5. Song perch and strata

The provisional record flagged "canopy" as everyday knowledge without a source.
There is now a source, and two independent field observations:

- Wikipedia: *"It usually sings from a high perch in a tree."*
- A09 recordist: singing "from a maple tree"; A10: "from the top of a 10m spruce
  tree"; A13: "from 15m up at top of spruce tree".
- Foraging is separate and stays ground-level (Wikipedia: "frequently seen
  running across lawns picking up earthworms").

Canopy as the preferred *singing* stratum, ground as a foraging stratum, is thus
defensible at the level of a secondary source plus recordist notes. The Birds of
North America account (Sallabanks & James 1999) remains unread — it is paywalled
— and is the right citation for a birder-grade claim.

## 6. Seasonality

Consistent with the current record, now citable: breeding spring and summer,
present year-round in much of the range, with northern breeders withdrawing and
winter flocks roaming for fruit (Wikipedia; A11 and A14 are winter berry-flock
recordings). Song period: "late February or early March to late July or early
August; some birds, particularly in the east, sing occasionally into September or
later." That argues for a *silent autumn* in the simulation — present, but not
singing — which the current `present` status half-says and the cadence table
does not.

## 7. What is still unverified

1. **What each file sounds like.** Partly answered by the 2026-11-22 audition.
   A09 is one prominent bird with other robins audible behind it; A10 carries a
   blackbird as well as the robin, so its buzz is not attributable to the robin;
   A08 carries a cardinal and a red-winged blackbird. Still open: A04, the source
   of the shipped clip, which no one has heard — and whose description says
   "Robins", plural, exactly the multi-individual caveat already in the record.
2. **Call names.** Nothing yet. A06 has a call under a wash of white noise and
   A19 a robin under a blue jay; neither produced a name, and no source read
   gives a taxonomy (ground-predator alarm, nest threat, flight call) with the
   names a birder uses. `calls[]` stays empty.
3. **Morning and midday rates.** Shape sourced, magnitude not.
4. **BNA.** The authoritative account has not been read.
5. **Whether the measured dawn rate belongs to dawn.** A09's own recordist says
   "before dawn", which is better evidence than A04's, but a recording's
   timestamp is not a study design.

## 8. Recommendation

Ship a robin with a defensible spread rather than one loop, accepting CC BY-SA
for most of it, and keep the PD McGrane clip as the attribution-light fallback:

| Role | Recording | Why |
|---|---|---|
| dawn carol | **A20, first 10 s** (CC BY-SA 4.0) | shipped 2026-11-22: auditioned as "very robin focused" for the opening 10 s; BirdNET 0.85 in every window; 50.1/min rendered vs 51.2/min file average. Dawn is anchored here |
| dawn corroboration | A09 (CC BY-SA 3.0) | auditioned: one prominent bird with a chorus behind it, 7 min of material; 71.5/min is a chorus upper bound |
| hisselly song | A10 (CC BY-SA 3.0) | **blocked** — auditioned and a blackbird is in the file |
| whisper song | A15 (CC BY-SA) | A08 **rejected** (cardinal + red-winged blackbird); A15 still unheard |
| second dawn male | A20 (CC BY-SA 4.0) | **approved 2026-11-22** — robin only, different region |
| call: contact/flight | A06 (CC BY-SA 3.0) | **not shippable** — a call, but white noise throughout; unnamed |
| call: flock/agitation | A19 or A14 (CC BY-SA 4.0) | A19 has a blue jay over the robin; A14 still unheard |
| PD fallback | A04 (PD) | already shipped; still unauditioned |

Do not ship A01/A02/A03 — 1.5–9 s with no stated context is not enough to justify
a label. Do not use A11 for cadence — 200 birds.

Candidate 12 s clips, cut so that the *rendered* audio measures at its parent
recording's average density (an earlier cut chosen by source-space window counts
measured 75–80/min once rendered — the "do not ship the densest window" trap — so
windows are now chosen by rendering each candidate through the shipping pipeline
and measuring the result):

```
candidates/robin-dawn-xc128490-from344.0s-12s.mp3      14 bursts = 71.6/min  (parent 71.5)
candidates/robin-dusk-xc132864-from164.0s-12s.mp3       8 bursts = 41.6/min  (parent 43.0)
candidates/robin-hisselly-xc129105-from36.0s-12s.mp3   12 bursts = 65.0/min  (parent 64.5)
```

Listen to `docs/curation/american-robin-audition.md` before any of this is
committed to the record; the song-type names and the call names are Alex's to
give, because that is ear work and the whole point of the record is that guesses
do not get to look like facts.

## 9. Reproducing this

```bash
# enumerate (no download)
python3 tools/curation/commons_audio.py "Turdus migratorius"

# download + SHA1-verify + record provenance
python3 tools/curation/fetch_audio.py --term "Turdus migratorius" \
  --include 'Turdus migratorius|Turdus-migratorius|American Robin' \
  --exclude 'Grey Jay|Grosbeak|Tanager|Mystery|LL-Q1860' \
  --dest ~/projects/birdie-curation/american-robin/source \
  --manifest ~/projects/birdie-curation/american-robin/manifest.json

# normalised listening copies (60 s max per distinct recording)
python3 tools/curation/make_audition_pack.py \
  --manifest ~/projects/birdie-curation/american-robin/manifest.json \
  --dest ~/projects/birdie-curation/american-robin

# candidate 12 s clips whose rendered audio measures at the stated rate
python3 tools/curation/pick_clip.py \
  ~/projects/birdie-curation/american-robin/source/Turdus_migratorius_-_American_Robin_XC128490.ogg \
  --target-rate 71.5 \
  --out ~/projects/birdie-curation/american-robin/candidates/robin-dawn-xc128490-from344.0s-12s.mp3
```

Audio and manifests stay outside the repo (`~/projects/birdie-curation/`): the
recordings are 30 MB of other people's work, and only the clips we ship belong in
the app.

## 10. Sources

| id | source |
|---|---|
| `johnson-2006` | Johnson, S. L. (2006). Do American Robins acquire songs by both imitating and inventing? *The Wilson Journal of Ornithology* 118(3): 341–352. doi:10.1676/05-048.1 |
| `slagsvold-1996` | Slagsvold, T. (1996). Dawn and Dusk Singing of Male American Robins in Relation to Female Behavior. *The Wilson Journal of Ornithology* 108(3): 507–515. doi:10.5281/zenodo.16520585 |
| `miller-1958` | Miller, R. C. (1958). Morning and Evening Song of Robins in Different Latitudes. *The Condor* 60(2): 105–107. doi:10.2307/1365267 |
| `seger-2011` | Seger, K. D., Rodewald, A. D., Soha, J. A. (2011). Urban noise predicts song frequency in Northern Cardinals and American Robins. *Bioacoustics* 20(3): 267–276. doi:10.1080/09524622.2011.9753650 |
| `miller-2006` | Miller, M. W. (2006). Apparent effects of light pollution on singing behavior of American Robins. *The Condor* 108(1): 130. doi:10.1093/condor/108.1.130 |
| `wiki-american-robin` | Wikipedia contributors. American robin. |
| `xc128490` etc. | individual Xeno-canto recordings, via their Commons mirrors (see table) |

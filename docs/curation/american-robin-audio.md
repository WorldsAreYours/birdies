# American Robin — sound curation, session 1

Status: **research complete; audition outstanding.** Nothing here has been
listened to yet, so everything derived from audio below is machine-measured and
the shipped record stays `verified: false`.

Session date: 2026-11-22. Species: American Robin, *Turdus migratorius*.
Scope: can we get enough licence-clean robin audio for real song variety, what do
the recordings actually contain, and what cadence figures can be defended.

## 1. Licence picture

Twenty-six files were enumerated on Wikimedia Commons (search by scientific name
and by common name; the scientific name returns the full set) and downloaded.
All 26 matched the SHA1 the Commons API reports for them, so the local copies are
the auditable originals. Four are the same recording mirrored twice (an `.ogg`
plus an XC-tagged `.mp3`), leaving **22 distinct recordings**.

| Licence | Files | Notes |
|---|---|---|
| Public domain | 3 | G. McGrane (song, 46 s), NPS Yellowstone (3.5 s), NPS/MSU Acoustic Atlas (call, 37 s) |
| CC BY-SA 3.0 | 10 | nine Xeno-canto mirrors + one 2007 Commons upload (GFDL/CC BY-SA, uploader `Mdf`) |
| CC BY-SA 4.0 | 9 | Xeno-canto mirrors, 2019–2021 |
| CC0 / CC BY / NC / ND | 0 | no plain-attribution tier exists in this set, and nothing here blocks a paid tier |

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

## 2. What the recordings contain

This is the thing the provisional record said it could not establish without
ears. It is now mostly established *without* ears, because the Commons mirrors of
Xeno-canto files carry the recordist's own `Type:` field, and the un-mirrored ones
state the context in a `Remarks` line:

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
**The counter is type-blind**: it counts call notes as happily as song phrases,
which is why A05 (a call) shows 70/min and A22 (a call) shows 10/min. It
measures a rhythm, not a behaviour.

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
| A04 McGrane (PD, 46 s) | "American Robins", North Carolina, context unstated | 38.1 s | **67.7** |
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

That converts one placeholder into data: `cadence.dusk` can move from a declared
20/min to a **measured 43.0/min** (single recording, one bird, mixed call and
song, so the figure is an upper bound on song alone). Morning and midday have a
documented *shape* but still no rate; they stay declared simplifications.

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
| dawn carol | A09 (CC BY-SA 3.0) | auditioned: one prominent bird with a chorus behind it, 7 min of material, several clean windows |
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

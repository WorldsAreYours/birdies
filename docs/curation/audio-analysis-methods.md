# Bird audio analysis — methods, evidence, and what Birdie should adopt

Research memo, 2026-11-22. This is about *method*: how the pipeline decides what a
recording contains and how often the bird does it. The defects already found in the
current chain live in the tracker under the `Audio pipeline audit` milestone; this memo
does not restate their status.

**One-sentence diagnosis:** the pipeline is measuring *elements* (the short units of
robin song) with a detector that has never been calibrated, then calling those counts
"songs" and scheduling a ten-second clip for each one.

Terms are defined on first use because they are the whole argument.

---

## 1. What the pipeline does now

1. **Signal QA** — band energies, SNR (signal-to-noise ratio: how far the loud parts sit
   above the noise floor), clipping and rumble share. Scripted in the
   `audio-corpus-curation` skill as `signal_qa.py`, not yet in this repo.
2. **Rate measurement** — decode to mono PCM, compute an RMS envelope (loudness per
   25 ms frame), threshold at `P10 + 0.35 × (P95 − P10)` of the file's own frame levels,
   merge runs separated by ≤ 120 ms, discard runs under 60 ms, divide the count by the
   active span. `measure_cadence.py` in the same skill.
3. **Species check** — BirdNET v3.0, 3 s windows, per-window confidence.
4. **Human audition** — song vs call, one bird or several, naming, whether a clip is
   shippable.
5. **Record** — the numbers, the method (`measured` / `published` / `simplified`) and a
   `provisional[]` list. `verified` is true only when that list is empty.

The method was learned the hard way: relative thresholds, active span, rendering the
clip that ships. Those choices are sound. The problem is what the counter is *counting*
and the fact that no one has measured its error rate.

---

## 2. Where the approach is standard practice

- **Envelope thresholding is a normal first-pass detector.** warbleR (Araya-Salas &
  Smith-Vidaurre 2017) ships amplitude-threshold and cross-correlation tools for exactly
  this, and scikit-maad (Ulloa et al. 2021) provides region-of-interest detection on
  spectrograms. A hand-rolled envelope counter is not exotic.
- **A threshold derived from the file's own distribution is better than an absolute dB
  value**, because recorders have different noise floors. The skill already says this.
- **Reporting the active span rather than the file duration** is correct; a file with
  8 s of silence at the head otherwise understates its own rate by a fifth.
- **Classifier before ear** is the right order. BirdNET is cheap, reads a file in
  seconds, and catches the worst failure — counting the wrong animal.
- **A human decides song vs call and one bird vs several.** That is not a gap in this
  project; it is the state of the field (see §5).

---

## 3. Where the method is not standard: four gaps

### 3.1 The counter is band-blind, and the threshold is global

An RMS envelope over the full band treats wind, traffic and handling noise as signal.
The threshold is a percentile of the whole file, so a constant low-frequency roar lifts
the floor above the quieter elements and they simply stop being counted. This is not a
tuning problem; it is the detector measuring the wrong band.

The measured consequence is in the tracker (issues about the shipped clip's rumble and
the dawn figure). The methodological point is simpler: **put the species band in the
measurement chain before counting.** Robin whistle elements sit at 1.5–4 kHz, with
elements spanning roughly 1–7 kHz; hisselly elements are wider and centred higher
(mean range 4.74 kHz; Johnson 2006, p. 342, citing Dziadosz 1977 and Tsipoura 1985).
A 150 Hz high-pass is the minimum; a 1–5 kHz band-pass is the defensible default for
whistle song, 1–7 kHz if hisselly material is being counted.

Does band-limiting matter in practice? On the two sources measured here, filtering
changed the count far less than it changed its *stability*:

| file, treatment | threshold .25 | .35 | .45 |
|---|---|---|---|
| A20 (XC570791), unfiltered | 29 elements / 42.4/min | 35 / 51.2 | 32 / 46.8 |
| A20, 150 Hz–5 kHz | 40 / 58.0 | 39 / 57.0 | 39 / 57.0 |
| A09 (XC128490), 150 Hz–5 kHz | 541 / 73.7 | 523 / 71.2 | 518 / 70.5 |

The unfiltered count is not even monotonic in the threshold — 42.4, then 51.2, then
46.8 — because the rumble and the bird interact with the percentile in different ways.
Once the band is limited, the count moves by under 2 % across a ±10-point threshold
range. **A number that moves with a filter setting is a property of the recording, not
of the bird.** Report the treatment with the figure, and never compare a filtered count
with an unfiltered one.

### 3.2 The unit is undefined: element, song and bout are three different things

This is the largest finding. Johnson (2006, p. 342) defines the units from the
spectrogram:

- **Note** — a continuous trace, 25–250 ms.
- **Element** — one or more notes, 150–350 ms; gaps between notes inside an element are
  10–125 ms.
- **Group / song** — robins combine elements into groups typically of 3–8 elements;
  gaps between elements are 250–2000 ms.
- **Bout** — a continuous singing period (Johnson recorded 1–29 bouts per bird, mean
  8.5).

The 120 ms merge threshold is, almost exactly, the note/element boundary. So the counter
produces an **element rate**. That is a good unit, and it is the unit Johnson uses when
he writes: *"During the robin's pre-dawn chorus, an individual will typically sing 100
elements in under 100 sec"* (2006, p. 344) — i.e. at least ~60 elements/min.

The record calls the figure `songsPerMinute`, and the simulation schedules one event per
figure. Both are wrong names for an element rate. The count changes by a factor of three
when the merge gap is changed, because the merge gap *is* the unit definition:

| merge gap (what counts as one unit) | A20, 150 Hz–5 kHz | A09, 150 Hz–5 kHz | shipped 10 s clip |
|---|---|---|---|
| 120 ms — elements | 39 units, 57.0/min | 523, 71.2/min | 7, 50.1/min |
| 250 ms | 32, 46.5/min | 486, 66.2/min | 4, 27.7/min |
| 400 ms — roughly groups | 13, 18.9/min | 331, 45.1/min | 2, 13.9/min |
| 700 ms | 11, 16.0/min | 79, 10.8/min | 1, 6.9/min |
| 1000 ms — pauses between phrases | 10, 14.5/min | 40, 5.4/min | 1, 6.9/min |

A20 is 43.78 s: an adult male for the first ~10 s, then mixed with Yellow-rumped Warbler and crows, band-passed 150 Hz–5 kHz, threshold 0.35, 25 ms frames. A09 is 441.6 s, a chorus with one prominent bird. The shipped clip is
`web/public/audio/american-robin/pillar-carol-01.mp3` (10.04 s), measured as-is.

There is no published rule that says a gap of 400 ms makes a song. Johnson says groups
are 3–8 elements and element gaps run to 2 s, so a 400 ms merge is *not* a validated
song boundary; it is another arbitrary unit. Without a sequence model or a human
annotation, the envelope cannot recover song boundaries. The honest output is an element
rate, plus a separate, explicitly defined song/bout rate if the product needs one.

The product consequence is concrete. At 51.2 events/min the scheduler fires every 1.17 s
(`web/src/sim/simulate.ts:36`), and every event carries a 10.04 s clip
(`american-robin.ts:30-46`). That is about 8.5 overlapping copies of the same ten seconds.
If the engine cuts the previous clip when the next starts, the clip never plays through;
if it mixes them, the yard is eight robins. Either way the cadence number and the audio
describe different units, and no amount of re-measuring 51.2 versus 57.0 fixes that.

### 3.3 The detector has never been validated

A rate is only as good as the detector that produced it. The pipeline reports a count,
the span and the parameters, but not the detector's error rate: how many real elements it
missed, how many noise bursts it invented. Without that, `method: 'measured'` means
"counted by a script", not "measured with a known instrument".

The bioacoustics literature is explicit that this is the hard part. Stowell et al. (2016)
survey bird detection and note that detection is still often manual or semi-automatic and
needs manual tuning; they call for tuning-free, species-agnostic methods. The Bird Audio
Detection challenge (Stowell et al. 2018) exists because general detectors did not
generalise. Even BirdNET, a mature model, has published precision of about 72–85 % and
recall of 33–84 % across studies (Pérez-Granados 2023). A hand-tuned envelope counter
with no validation is below that bar, not above it.

The cheap fix is not a new model. It is a **small hand-annotated validation set**: two to
three minutes of audio across three recordings, with element onsets and offsets marked
(by ear in Audacity, or on a spectrogram in Sonic Visualiser), then count precision and
recall at the chosen parameters. Twenty minutes of annotation buys an error bar for every
future file. Until then, the right word for the figures is "counted", and the note should
say what the count is a count *of*.

### 3.4 One number, no uncertainty

The counter returns a point estimate. The threshold sweep above shows the same file can
give 57.0 or 58.0 depending on a parameter nobody would defend to three significant
figures. The literature's unit for this kind of behavioural rate is not a point estimate:
the Vocal Activity Rate index is defined as "the number of songs per unit time for a
species" (Pérez-Granados et al. 2019), and studies of sampling effort show the estimate
depends on how long and when you listen (Pérez-Granados et al. 2019, *Ecological
Indicators*). The game needs a believable cadence, not a laboratory constant, so a
range is both more honest and more useful: "70.5–73.7 elements/min over 440 s" is a better
record than "71.2", and "73 on a 10 s single-male sample, 71 on a chorus" is a better claim than
either point alone.

---

## 4. What the field does, and what is worth adopting here

| question | established approach | evidence | verdict for Birdie |
|---|---|---|---|
| Is the recording usable? | band energies, SNR, clipping, noise floor; inspect a spectrogram | engineering practice; no single published threshold | keep, and put the band-pass in the counting chain |
| Where are the vocalisations? | band-limited time–frequency detection (scikit-maad CWT regions; warbleR amplitude/cross-correlation); template matching for stereotyped units | mature tools; still analyst-tuned | keep the envelope for elements; band-limit it; add a small validation set |
| Which species? | BirdNET / Perch; report per-window presence and margin, not max confidence | peer-reviewed family; BirdNET v3 has no independent paper | keep BirdNET; report window fraction and top1–top2 gap |
| Song vs call? | no general model; recordist `Type:` label + human ear | absence of a method, not a negative result | keep human; never infer from the envelope |
| One bird or several? | microphone arrays or source separation; no validated mono method | research problem | do not attempt from mono |
| Which call/syllable types? | unsupervised clustering of features or embeddings; UMAP + HDBSCAN; still needs human names | lab/single-species validation (Sainburg et al. 2020); unsupervised parsing still open (TweetyBERT 2026) | build as triage only, with hand-named clusters |
| How often? | Vocal Activity Rate (songs per unit time), with stated unit and sampling effort | established index; unit definition is the weak point | define the unit first, then measure |

Details worth keeping:

- **Perch v2 is supported by the installed `birdnet` package** (version 1.5.1 has
  `acoustic/models/perch_v2`), with 5 s windows, 32 kHz input and 1536-dimensional
  embeddings. But using it requires TensorFlow ≥ 2.20 and a 379 MB weight download, so it
  is not free; the package contains the code path, not the weights. Its value is a
  different architecture and window size, not independence: BirdNET and Perch both draw
  heavily on Xeno-canto and Macaulay, so agreement between them is weaker evidence than
  agreement between either and a human.
- **BirdNET's confidence is not a probability.** The useful statistic is the share of
  windows above threshold plus the gap to the next species. The Hermit Thrush catch was
  strong because of eleven consecutive windows at 0.87–0.93 against one robin window the
  human had independently placed at 42 s, not because 0.9 is high.
- **Embeddings are the wrong scale for syllables.** Perch/BirdNET/AVES/BEATs are trained
  on 3–10 s clips to separate species; a robin element is 150–350 ms. Feeding a 3 s
  embedding window to a 200 ms element mostly encodes the background. For clustering,
  start with classical features — duration, bandwidth, peak frequency, MFCCs (mel-frequency
  cepstral coefficients, a compact description of the spectral envelope) — then cluster;
  use embeddings only as an experiment.

---

## 5. What the literature actually says about robin rates

Three classics are cited in the record. Reading them changes what they can support.

**Johnson (2006)** — 42 wild males, western Massachusetts, 18 April–4 August 2002,
pre-dawn recordings. This is the only source here that states an element rate:
"an individual will typically sing 100 elements in under 100 sec" during the pre-dawn
chorus. It also supplies the unit definitions and the 3–8-element group size. It is not
a study of rate variation, and 42 birds at three sites is not a population sample.

**Slagsvold (1996)** — 12 mated males, Seattle, 13–28 April 1994. Song activity is
measured as **the percentage of minutes in which the male was heard singing**, in 10- and
30-min bins — not songs per minute. The abstract's "peak at dawn, little around noon" is
a statement about that percentage. The paper adds a useful nuance the record does not
carry: in the evening, 3 of 10 mated males did not sing at all, and the other 7 had only
one or two song periods of 1–9 min. "Dusk is a second, lesser peak" (Miller 1958) is
about mated males in a different study; Slagsvold's evening birds were mostly quiet.
No rate figure can be lifted from this paper.

**Miller (1958)** — observations along 37–61°N in June 1957. The paper's table is
start/end times and duration of morning and evening song, in minutes; it contains no
song-rate measurement. It does describe an individual singing for 39 minutes with only
brief interruptions and pauses "normal to the phrasing of the song" — evidence for
continuous caroling, not for a rate.

**Seger et al. (2011)** — 53 robins, central Ohio, May–July 2006. It measured song length
and rate against ambient noise and found neither related to noise. The abstract does not
report the mean rate; the full text is paywalled. It is a good citation for "rate is a
stable trait", not for a magnitude.

**What this means:** there is one published element-rate anchor (Johnson, ≥60/min), one measured
chorus rate (A09, 71/min) and one measured single-male span (A20, 73/min over the clean 10 s opening).
The 57/min over the whole A20 file is not a single-male figure: the recording turns mixed after ~10 s,
so that count includes other species. The only honest single-male point estimate is 73 elements/min
from a 10 s sample, corroborated by Johnson's ≥60/min; A09 is a chorus upper bound. A single male's
average over a longer clean recording does not exist in this corpus. Morning and midday have a
documented *shape* but no published magnitude; those remain declared simplifications, which is what
the record already says.

---

## 6. Recommendations, in order

1. **Make the unit explicit in the data model.** The normative definitions and field names
   are in `docs/vocalization-units.md`: `perMinute` plus `unit: 'element' | 'song' | 'bout'`,
   and `clipUnit` on every variant. For the robin, write the
   record as "73 elements/min over the 10 s robin-only opening (57 over the full mixed
   file), 150 Hz–5 kHz band-pass, threshold 0.35, 120 ms merge". If the product needs
   *songs*, define a song as a group of 3–8 elements
   (Johnson) and either measure group boundaries by hand or schedule at the element
   level with element-length clips. Do not put a group rate in a field called
   `songsPerMinute` without saying how the group was defined.
2. **Band-limit the measurement chain and the shipping chain together.** 150 Hz
   high-pass minimum; 1–5 kHz (or 1–7 kHz for hisselly) for the counter. Measure the
   parent and the render through the same function, and record the treatment with every
   number. This is already the direction of the audit issues; the research point is that
   the band is part of the *measurement*, not just the product polish.
3. **Validate the detector once.** Annotate two to three minutes across three
   recordings; report precision and recall at the chosen parameters, plus the count
   range over a threshold and merge-gap sweep. Version the parameters. After that,
   "measured" has a defensible meaning.
4. **Co-design clip length and cadence unit.** The shipped 10 s clip contains 7 elements
   (50.1/min); at 57/min ten seconds is about 9.5. If an event is an element, the clip must be
   an element (roughly 0.2–1 s); if the clip is a 10 s bout, the event rate must be a bout rate
   (single digits per minute). Pick one and make the scheduler and the record agree.
5. **Keep BirdNET, change what you report.** Window fraction and margin, not max
   confidence; run it on the artefact that ships. Add Perch v2 only if an identification
   is contested, and budget TensorFlow plus 379 MB.
6. **Clustering as triage, not oracle.** Classical features first; UMAP + HDBSCAN if
   useful; hand-name every cluster and report stability. Song vs call and individual
   counts stay human.

---

## 7. What was read, and what could not be

Read in full: Johnson (2006) via the Biodiversity Heritage Library scan mirrored on
Zenodo; Slagsvold (1996) the same way; Miller (1958) via the Internet Archive scan of
*The Condor* 60(2). Abstracts read for Seger et al. (2011), Pérez-Granados (2023),
Pérez-Granados et al. (2019, both papers), Stowell et al. (2016, 2018), Ulloa et al.
(2021), Hamer et al. (2023), Sainburg et al. (2020).

Direct BHL and USF Digital Commons downloads were blocked by Cloudflare from this host;
the Zenodo and Internet Archive mirrors were used instead. Seger et al. (2011) is
paywalled and its mean rate could not be checked. BirdNET v3.0 is a model release with
no independent peer-reviewed validation; the 2021 paper describes the model family, not
the deployed weights.

---

## 8. Sources

| id | source |
|---|---|
| Johnson 2006 | Johnson, S. L. (2006). Do American Robins acquire songs by both imitating and inventing? *The Wilson Journal of Ornithology* 118(3): 341–352. doi:10.1676/05-048.1 |
| Slagsvold 1996 | Slagsvold, T. (1996). Dawn and dusk singing of male American Robins in relation to female behavior. *The Wilson Bulletin* 108(3): 507–515. doi:10.5281/zenodo.16520585 |
| Miller 1958 | Miller, R. C. (1958). Morning and evening song of robins in different latitudes. *The Condor* 60(2): 105–107. doi:10.2307/1365267 |
| Seger et al. 2011 | Seger, K. D., Rodewald, A. D., Soha, J. A. (2011). Urban noise predicts song frequency in Northern Cardinals and American Robins. *Bioacoustics* 20(3): 267–276. doi:10.1080/09524622.2011.9753650 |
| Pérez-Granados et al. 2019a | Pérez-Granados, C., Bota, G., Giralt, D., Barrero, A., et al. (2019). Vocal activity rate index: a useful method to infer terrestrial bird abundance with acoustic monitoring. *Ibis* 161(4): 901–907. doi:10.1111/ibi.12728 |
| Pérez-Granados et al. 2019b | Pérez-Granados, C., Gómez-Catasús, J., Bustillo-de la Rosa, D., Barrero, A., et al. (2019). Effort needed to accurately estimate Vocal Activity Rate index using acoustic monitoring: a case study with a dawn-time singing passerine. *Ecological Indicators* 107: 105608. doi:10.1016/j.ecolind.2019.105608 |
| Pérez-Granados 2023 | Pérez-Granados, C. (2023). BirdNET: applications, performance, pitfalls and future opportunities. *Ibis* 165: 1068–1075. doi:10.1111/ibi.13193 |
| Kahl et al. 2021 | Kahl, S., Wood, C. M., Eibl, M., Klinck, H. (2021). BirdNET: a deep learning solution for avian diversity monitoring. *Ecological Informatics* 61: 101236. doi:10.1016/j.ecoinf.2021.101236 |
| Hamer et al. 2023 | Hamer, J., Triantafillou, E., van Merriënboer, B., Kahl, S., Klinck, H., Denton, T. (2023). Global birdsong embeddings enable superior transfer learning for bioacoustic classification. *Scientific Reports* 13: 22876. doi:10.1038/s41598-023-49989-z |
| Stowell et al. 2016 | Stowell, D., Wood, M., Stylianou, Y., Glotin, H. (2016). Bird detection in audio: a survey and a challenge. *IEEE MLSP* 2016: 1–6. doi:10.1109/MLSP.2016.7738875 |
| Stowell et al. 2018 | Stowell, D., Wood, M., Pamuła, H., Stylianou, Y., Glotin, H. (2018). Automatic acoustic detection of birds through deep learning: the first Bird Audio Detection challenge. *Methods in Ecology and Evolution* 10(3): 368–380. doi:10.1111/2041-210X.13103 |
| Araya-Salas & Smith-Vidaurre 2017 | Araya-Salas, M., Smith-Vidaurre, G. (2017). warbleR: an R package to streamline analysis of animal acoustic signals. *Methods in Ecology and Evolution* 8(2): 184–191. doi:10.1111/2041-210X.12624 |
| Ulloa et al. 2021 | Ulloa, J. S., Haupert, S., Latorre, J. F., Aubin, T., et al. (2021). scikit-maad: an open-source and modular toolbox for quantitative soundscape analysis in Python. *Methods in Ecology and Evolution* 12(12): 2334–2340. doi:10.1111/2041-210X.13711 |
| Sainburg et al. 2020 | Sainburg, T., Thielk, M., Gentner, T. Q. (2020). Finding, visualizing, and quantifying latent structure across diverse animal vocal repertoires. *PLoS Computational Biology* 16(10): e1008228. doi:10.1371/journal.pcbi.1008228 |
| TweetyBERT 2026 | Vengrovski, G., Hulsey-Vincent, M., Bemrose, M., Gardner, T., et al. (2026). TweetyBERT: automated parsing of birdsong through self-supervised machine learning. *Patterns* 7(4): 101491. doi:10.1016/j.patter.2025.101491 |
| BirdNET v3 | `birdnet-team/birdnet` v1.5.1, acoustic model v3.0 (ONNX). Model card: https://github.com/birdnet-team/birdnet |

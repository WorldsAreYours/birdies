# Birdie — Repository Assessment & Transition Plan

Status: **approved and executed by Alex on 2026-11-22.** `main` was rewritten to begin the Birdie era;
the legacy detector is preserved at branch `archive/legacy-detector` and tag `legacy-detector-v0.1`
(tip `e39b866`). No application code exists yet — this document is the first commit of the new `main`.

Decision log (updated after product clarification):
**Scope sharpened (Alex): realism and authenticity are the product.** Real song variety per bird,
cadence taken from real data, positioning/sound/variant grounded in ornithology, time of day and
terrain mattering, and a result that satisfies both a hardcore birder and a child. Consequences:
the chorus engine becomes a simulator; content curation becomes the critical path; physical pieces
and the NFC programme are parked so the realism work gets the budget.
**D1 — RESOLVED.** The game is primary. Birdie does not need to behave like BirdNET, and passive
backyard monitoring is out of scope. If live microphone detection is built at all, it exists only to
serve the existing game pieces, and it only ever discriminates the five catalogue species. Therefore
v1 is **quiz-by-ear**, and no phase depends on porting BirdNET.
D2 → American Robin, Northern Cardinal, Blue Jay, Black-capped Chickadee, Mourning Dove;
D3 → public-domain/CC0 or CC-BY recordings only, provenance stored per species;
D4 → branch from `main`, leave `phase-2` alone until Phase 5 (no merge yet);
D5 → RESOLVED: pieces answer birdsong prompts (see §6).

Assessed at: `WorldsAreYours/birdies` @ `e39b866` (main, 2026-06-19), branches `phase-1`, `phase-2`.
Clone: `/home/hermes/projects/birdies`

---

## 1. What the existing repository actually is

A **Python desktop/CLI bird-audio detector**, not a web application. 17 tracked files,
29 commits (2026-06-01 → 2026-08-08), 572 KB.

### Runtime pipeline (main)

```
mic ──sounddevice InputStream (48 kHz, mono, 3840-frame blocks, ~80 ms)
    └─ AudioRingBuffer (3 s rolling window, numpy, threading.Lock)
        └─ every 3 s: Analysis.noise_analysis()
            ├─ Silero VAD → human-speech ratio; if > 0.70 → skip ("eww humans")
            └─ BirdNET (birdnetlib, TFLite) via run_in_executor → detections
                └─ append to ~/.birdie/timeline.jsonl (timestamped)
```

| File | Role | Notes |
|---|---|---|
| `src/main.py` | asyncio loop, wiring, 3 s cadence | `ACTIVE_STATE` global is never mutated (dead) |
| `src/record/recorder.py` | `sounddevice.InputStream` wrapper | ~30 lines, dual camel/snake accessors |
| `src/record/audio_ring_buffer.py` | thread-safe numpy ring buffer | clean, well-tested, ~40 lines of real logic |
| `src/record/analysis.py` | VAD gate + BirdNET call + JSONL persist | prints `"eww humans"`, `"birds, great."` |
| `src/record/birdnet.py` | `birdnetlib` `Analyzer` + `RecordingBuffer` | 18 lines; `self.error` never set |
| `src/tflite_runtime/` | macOS shim → `ai-edge-litert` | platform hack, not product code |
| `tests/` | 8 tests | all use injected fakes; no model download needed |

### Branch state

- `phase-1` — **byte-identical to `main`** (0 commits ahead/behind). Stale duplicate.
- `phase-2` — 5 commits ahead of `main`, fast-forwardable, unmerged. Restructures into
  `backend/` + `frontend/`.
  - backend adds: SQLite (`users`, `sessions`, `detection_windows`, `observations`), session
    lifecycle, silence gating (RMS < 0.005), confidence filter (≥0.75, immediate at ≥0.9),
    two-window confirmation for weak detections, review states, `rebuild_observations.py`,
    and 18 tests. **This is the most valuable code in the repo.**
  - frontend is the **stock Vite React template** (`App.tsx` = "Get started / count is N").
    No product UI, no API client, no integration. A `backend/README.md` section documents a
    planned WebSocket multi-user design — **not implemented**.

### Reusable assets: essentially none

Verified across the full history of all branches:

- **No audio files.** No bird recordings, no reference songs.
- **No model files.** BirdNET is downloaded at runtime by `birdnetlib`; nothing is vendored.
- **No species list, no images, no art, no icons** (only Vite/React template logos).
- **No UI, game, collection, journal, chorus, NFC, or QR code anywhere.**

The only reusable thing is **domain knowledge**: the detection-gating logic and its tuned
thresholds, and the fake-injection testing style.

---

## 2. Reuse verdict

The new product is a client-side TypeScript mobile game with no backend. The existing code is
Python, needs a native microphone and a native ML runtime, and has no UI. **There is no code
path from one to the other** — a rewrite is not a preference, it is the only option.

Worth carrying over as *reference*, not as code:

| Existing | Reuse | How |
|---|---|---|
| `AudioRingBuffer` algorithm | **Yes, reimplement** | ~40 lines of TS; the wrap-around/ordering tests port almost 1:1 |
| VAD / silence / confidence gating + thresholds | **Yes, as knowledge** | Encode as documented pure functions; only relevant if mic detection is chosen |
| Two-window confirmation heuristic | **Yes, as knowledge** | Genuinely good anti-false-positive logic; worth preserving in a `detection/` module |
| Fake-injection test style | **Yes, as pattern** | Define `Detector` / `VadGate` interfaces; test the game loop without real audio |
| `phase-2` backend SQLite design | **No** | Server persistence contradicts "no backend"; the *entity model* (species, observation, session) is a useful reference for the local schema |
| `phase-2` frontend | **No** | Template scaffold only |
| `tflite_runtime` shim | **No** | Platform hack |

**Preserve** (do not delete, do not rewrite): `main` history, `phase-2` (it is the only record of
the detection-tuning work), the Python detector as a working reference, the CC0 LICENSE.

**Replace**: everything user-facing. The new app is new code in a new directory.

**Retire later, by approval**: the Python detector moves to `legacy/detector/` via `git mv` in its
own commit (rename detection keeps history) once the web app owns the repo root. Not in Phase 1.

---

## 3. Environment findings

| Item | State | Impact |
|---|---|---|
| Node | **v18.19.1** | ❌ Vite 6/7/8 require Node 20.19+ / 22.12+. **Hard blocker.** |
| npm | 9.2.0 | ⚠️ ships with Node 18; fine once Node is upgraded |
| Python (system) | 3.12 | ❌ repo pins `>=3.10,<3.12`; system Python cannot run it |
| `uv` | **not installed** | ❌ required to run/verify existing Python tests |
| `bun` | not installed | ✅ irrelevant — phase-2's bun-only setup is a reason *not* to copy its tooling |
| `gh` CLI | installed, **not authenticated** | ❌ cannot create/push branches or open PRs as configured |
| git | 2.43.0, HTTPS clone works | ✅ |
| ffmpeg | present | ✅ useful for audio asset prep |
| Resources | 3.7 GB RAM, 22 GB free | ✅ fine for a static Vite app; too small for local ML training |
| Network | npm registry + GitHub reachable | ✅ |

**The existing Python test suite cannot be run on this host as-is** (no `uv`, no Python 3.10/3.11,
no torch/tflite). I have not installed anything — that is an environment-change decision, and the
tests are not needed to validate the new app. If you want the legacy detector kept runnable, that
is a separate, optional "legacy harness" task.

---

## 4. Recommended architecture

### Shape

Single static Vite app. No server, no accounts, no database service. All state on-device.

```
birdies/                      ← existing repo, unchanged on main
  web/                        ← NEW: the Birdie app
    index.html
    package.json                (npm, Node 22 LTS)
    tsconfig.json               (strict)
    vite.config.ts
    vitest.config.ts
    public/
      audio/<speciesId>/<variantId>.mp3   ← multiple song variants per bird
      art/<speciesId>.svg
    src/
      main.tsx                  ← entry
      app/                      ← shell, routing (hash router, no dependency)
      species/
        records/                ← one file per bird: songs, cadence, habitat, season, sources
        catalog.ts              ← index over records; typed, validated at build time
        types.ts
      env/
        clock.ts                ← pure: simulated, player-set time → Environment (never Date.now())
        season.ts               ← pure: date/location → season + daylight window
      sim/
        rate.ts                 ← pure: songs/min for (species, environment)
        variants.ts             ← pure: which song type plays next
        simulate.ts             ← pure: (environment, birds, seed, horizon) → events
        scheduler.ts            ← thin: look-ahead window feeding the audio engine
      game/
        round.ts                ← pure state machine: prompt → place piece → reveal
        scoring.ts              ← pure
      backyard/
        strata.ts               ← pure: yard zones (canopy, midstory, shrub, ground, feeder, bath)
        placement.ts            ← pure: slots, collision, layout
      journal/
        entries.ts              ← pure: field-guide entries, two reading depths
      audio/
        engine.ts               ← Web Audio wrapper (decode, play, mix) — the only side-effectful module
      storage/
        local.ts                ← versioned localStorage adapter; swappable for IndexedDB
      tokens/
        token.ts                ← parse/emit token ids (parked; URL-based, no backend)
      ui/                       ← components, styles
  legacy/detector/              ← Phase 5, by approval only
```

### Non-negotiables (from the product direction)

- **Cozy.** Short sessions, no timers that punish, no streak guilt, no loss states. Sound and pace are
  the product. Note the tension this now carries: realism means the yard is sometimes quiet, so the
  app must make silence feel like *place* rather than *emptiness* — and it must never invent birdsong
  to fill a gap.
- **Playable anywhere.** Offline is a functional requirement, not an optimisation: every asset is
  precached at install, no screen may require a network fetch, and losing signal mid-round must be
  invisible. This rules out runtime model downloads, remote audio, hosted fonts and any API call on
  the play path.
- **With the game pieces.** The pieces are part of play, not merchandise: a piece identifies a bird
  and is how the player answers. The same stable `tokenId` backs the on-screen piece, the printed QR
  and the NFC tag, so a piece works on hardware you do not own yet.
- **No accounts, no backend, no sync.** Progress lives on the device. Cross-device transfer, if ever
  wanted, is an export/import string, not a server.

Design rules:

1. **The species records are the product. Code plays them.** Every screen and every sound derives from
   `species/records/*`. Adding a sixth bird is a data edit, not a code change. Realism lives in the
   data, so the engineering goal is to make the data *expressive enough* to hold real ornithology
   without a code change every time: cadence curves, song-type weights, habitat strata, seasonal
   presence, provenance. Anything hard-coded about a bird's behaviour is a bug in the model.
2. **Pure core, thin edges.** `game/`, `backyard/`, `journal/`, `storage/` (serialization) are pure
   functions over plain data. Only `audio/engine.ts` and the React shell touch the browser. This is
   why the tests can be fast and dependency-free.
3. **Audio via Web Audio API directly.** No Howler/`tone.js`. The chorus is *n* decoded buffers
   scheduled with per-species gain/pan/interval — roughly 100 lines, fully ours, testable by
   asserting on the generated schedule rather than on sound.
4. **Listening is a game mechanic, not an identifier.** If a microphone path is built, it answers
   exactly one question — *"which of the five catalogue birds just sang?"* — behind
   `interface SongDetector { listen(): Promise<SpeciesId | null> }`. It is not BirdNET parity, not
   an open-set classifier, and never a passive monitor. Because the problem is 5-class and closed,
   the cheap implementations (DSP template matching over the bundled clips, or a tiny 5-class model
   trained on them) are plausible and testable offline; general-purpose inference is not required.
   Nothing in the game code knows which implementation is behind the interface.
5. **Persistence = one versioned JSON blob** in `localStorage` (`birdie.save.v1`). A journal plus a
   backyard is a few KB. IndexedDB is a later swap behind the same adapter interface if saves grow.
6. **Tokens are URLs.** A token resolves to `https://<host>/#/t/<tokenId>`; the app looks up
   `tokenId` in the bundled catalogue. No backend, no validation service, and the *same* string
   encodes to NTAG215 NDEF and to a QR code — so a physical token and a printed card are one
   mechanism. Web NFC works on Chrome/Android only; iOS falls back to the camera scanning the QR.
   Defining the id scheme now avoids URL churn later.
7. **Offline-first is structural.** `vite-plugin-pwa` precaches the shell, the five clips and the art
   in one versioned cache; the app is usable with the radio off from first successful load. Service
   worker updates are *prompted*, never silent — a background swap mid-round would cost the player
   their turn. Save data is versioned (`birdie.save.v1`) with a migration hook, because offline users
   upgrade on their own schedule.

### The backyard simulation

**Realism turns the chorus from a mixer into a simulator.** The earlier framing — five clips overlapped
under a set of taste rules — is now wrong, because "cadence based on real facts" cannot be authored by
hand. If a cardinal sings every 4 seconds in the app and every 20 seconds in life, a birder notices
immediately, and the app is teaching something false. So the chorus must be **emergent**: each bird
vocalises at a rate derived from data, gated by time of day, season and where it sits in the yard,
choosing among its real song types. Nothing is pre-scripted, and the same yard never sounds the same
twice.

That is a genuine architectural change from the first draft: a *model* replaces a schedule, and the
model is where the authenticity lives.

**Environment — pure and injectable, so tests are deterministic:**

```ts
type Environment = {
  hour: number                     // 0–24, fractional
  season: 'spring' | 'summer' | 'fall' | 'winter'
  habitat: 'suburban-yard' | 'woodland-edge' | 'wetland'   // v1: suburban-yard only
  daylight: { sunrise: number; sunset: number }
}
```

**The species record is the unit of authenticity.** Not a name and an mp3:

```ts
type SpeciesRecord = {
  id: SpeciesId
  commonName: string
  scientificName: string
  songs: SongVariant[]       // id, clip, duration, songTypeName, recordist, license
  calls: SongVariant[]       // calls are not songs; birders care, children don't yet
  cadence: Record<Period, { perMinute: number; unit: 'element' | 'song' | 'bout'; source: Citation }>
  seasonality: Record<Season, 'breeding' | 'present' | 'absent'>
  strata: { preferred: Stratum; tolerated: Stratum[] }
  sources: Citation[]        // per claim, not per bird
  verified: boolean          // false ⇒ UI presents facts as provisional
}
```

`verified` and per-claim citations are not bureaucracy. The stated audience includes the hardcore
birder, who will check. An unsourced claim must render as provisional in the UI rather than be
asserted with the same confidence as a sourced one.

**Cadence is a function, not a constant:**

```ts
vocalizationRate(record, env, stratumMatch) -> RateResult
```

Base rate per period (dawn / morning / midday / dusk / night) × seasonal presence (zero when absent) ×
stratum match (full in the preferred stratum, reduced in tolerated, near-zero elsewhere). Event
generation is then a seeded Poisson process over a horizon:

```ts
simulate(env, birds, { seed, horizon }) -> VocalizationEvent[]
```

Deterministic for a seed, which is what makes realism *testable*: "a wood thrush produces zero events
at 02:00 in winter" becomes an assertion rather than a vibe. Realism without tests is just flavour
text that will rot.

**Song variety.** Each bird needs several real song types, not one clip on loop. Variants are drawn by
weight, with a no-immediate-repeat rule — real birds do repeat, but hearing the *same recording* twice
in a row is a recording artifact, not biology. Honesty note: a cardinal has dozens of song types and
we will ship a curated subset; the record should say "3 of ~16 recorded song types" rather than imply
a complete repertoire. Being explicit about what we left out is itself part of the educational value,
and it protects against the birder's first objection.

**Positioning and sound follow the strata.** Yard placement picks a stratum (canopy, midstory, shrub,
ground, feeder, bath); stratum drives pan, gain and a gentle lowpass, so canopy birds read as high and
distant and ground birds as close and dry. Placement is therefore *load-bearing*, not decorative: put a
ground feeder in the canopy and the bird should not sound right, because it wouldn't be. This is also
the cheapest way to teach habitat — the player hears the mistake before reading about it.

**What realism costs, stated plainly:**
- **Content becomes the critical path.** Five species × (several song variants + call notes + cadence
  by period + seasonal presence + stratum preference), each with a citation. That is curation and
  research, not coding — roughly 25–40 audio files and 60–100 sourced claims before the first bird is
  trustworthy. It is also the part I cannot fake: I will not invent a songs-per-minute figure.
- **Authentic cadence versus a game you can play at any time.** A cardinal singing at 2 a.m. is wrong;
  a game that only works at 5 a.m. is worse. Realism has to be reconciled with "played anywhere"
  (D8).
- **Birder depth versus child accessibility.** These pull in opposite directions. The proposed
  resolution is progressive disclosure over one dataset, not a compromise that serves neither (D9).

**Signal chain:** `AudioBufferSource → GainNode → StereoPannerNode → masterGain → DynamicsCompressor → destination`.
One `AudioContext` for the whole app, created lazily on the first user gesture (required by iOS),
clips decoded once at first play and cached as `AudioBuffer`s.

**Platform realities that shape the code:**
- iOS requires a gesture before audio; nothing may autoplay.
- The iOS hardware silent switch mutes Web Audio — the UI must not imply sound is playing when it
  isn't; a visual pulse accompanies every voice.
- Backgrounding suspends the context; resume on `visibilitychange`.
- Clips are precached, so the chorus works offline like everything else.

**Accessibility:** every vocalisation also drives a visual pulse (silhouette nudge or shape bloom), so
the backyard is perceivable muted — which matters more now that the yard is often quiet by design. The
pulse respects `prefers-reduced-motion` by swapping to a static highlight. Volume persists in the save.

**Explicitly not in scope:** procedural song synthesis, generative melody, key/tempo alignment,
per-individual vocal signatures, flock dynamics, migration, weather. Realism here means *faithful
reproduction of documented behaviour*, not a full ecological model. Where the simulation is simplified,
the UI says so — a simplification you admit is education, one you hide is misinformation.

### Stack recommendation (and what I'd reject)

| Choice | Recommendation | Reason |
|---|---|---|
| Language | TypeScript 5.x, `strict` | as directed |
| Bundler | Vite (latest) | as directed |
| UI | React 19 + `@vitejs/plugin-react` | screens/state are real; already the repo's stated direction |
| React Compiler + babel plugin | **Drop** | phase-2 enabled it; it slows dev/build and buys nothing at this scale |
| Package manager | **npm** | already present; bun adds a second toolchain for no gain |
| Styling | plain CSS modules + CSS custom properties | cozy art direction needs hand-tuning, not a framework |
| State | `useState`/`useReducer` + context | no Redux/Zustand for a 4-screen game |
| Tests | Vitest (+ `@testing-library/react` only for the shell) | pure core needs no DOM |
| Lint | `oxlint` + `tsc --noEmit` | fast, near-zero config; one linter, not two |
| PWA | `vite-plugin-pwa` | justified: mobile-first, offline backyard, add-to-home-screen |
| Audio | Web Audio API | no dependency |
| Detection (later) | ONNX Runtime Web or TF.js — **unproven, spike first** | see risk R1 |

Net dependencies for v1: React, React DOM, Vite, TypeScript, Vitest, Testing Library, oxlint,
vite-plugin-pwa. That is a deliberately small list, and each entry has a stated reason.

### Deployment

Static files only. **Cloudflare Pages** (free tier, PR preview URLs, custom domain) — with GitHub
Pages via Actions as the zero-extra-account fallback. No server, no database, no secrets, no
runtime cost. Total infra cost: **$0**.

CI (GitHub Actions, on PR): `tsc --noEmit` → `oxlint` → `vitest run` → `vite build`. Fails the PR
on any of them. Deploy-on-merge to `main` only, and only after you approve that step — I will not
wire deployment without explicit instruction.

Because "played anywhere" is a requirement, everything ships same-origin: no Google Fonts, no remote
audio, no CDN script tags. All of those would be network calls on the play path and would break
precaching. Assets are content-hashed and served immutable; only `index.html` and the service worker
are short-lived. Offline is verified by hand each phase (load once, go offline, play a full round)
until a browser smoke test is worth the dependency.

---

## 5. Phased plan

The scope items below say what each phase must contain. The work itself is tracked as GitHub
issues under a milestone per deliverable (see `AGENTS.md`, "Tracker"), and this section carries
no status: where it and the tracker disagree about what is done, the tracker is right.

### Phase 0 — Environment & branch (½ day)
- Install Node 22 LTS (nvm) — required before any Vite work.
- Create `feat/birdie-web-app` from `main` (not from `phase-2`; see D4).
- Commit this assessment as `docs/birdie-transition-plan.md`.
- Add `.gitignore` entries for `node_modules`, `dist`, `.env*.local`.
- Exit criteria: `node -v` ≥ 22, branch exists, nothing else changed.

### Phase 1 — Data spine + one bird, faithfully (3–5 days) ← *the first real deliverable*
The slice is no longer "a game loop with a placeholder bird". It is **one bird that behaves correctly**,
because that is the riskiest assumption in the whole product and the cheapest one to test first. If the
model can't make one robin convincing, five won't help.

Scope:
1. Vite + TS + React scaffold in `web/`, mobile-first viewport, no routing library.
2. `env/` — `Environment` type plus a **simulated, player-set clock** (D8). Time is injected into all
   logic, never read from `Date.now()`, so tests can place the app at 05:40 in April and the saved
   game restores to the same simulated morning.
3. `species/types.ts` + **one fully curated record** (sources, verified:true) and four stubs marked
   `verified:false` so the schema is exercised but nothing false is asserted.
4. `sim/` — `rate.ts`, `variants.ts`, `simulate.ts`, `scheduler.ts`. Tests assert: zero events when the
   season says absent; rate within bounds for a given period; no immediate repeat of the same variant;
   determinism for a seed.
5. `audio/engine.ts` + look-ahead scheduler: the yard actually sings at the documented cadence.
6. **Pieces as the answer input.** `pieces/PieceRack.tsx`; a piece carries its `tokenId`, the same
   identifier a printed QR or NTAG215 tag will carry. No hardware needed, no migration later.
7. One identification round: prompt plays a real variant → player answers with a piece → reveal.
8. Placement into a **stratum**; wrong stratum audibly degrades the bird (rate and tone), because
   habitat is a fact, not decoration.
9. Journal entry with two depths (child sentence / birder detail) over the one record.
10. Save + offline; `tsc`, `oxlint`, `vitest`, `vite build` green.

Explicitly **out** of Phase 1: printing, NFC, microphone, weather, second habitat, second season, more
than one curated bird.

Acceptance criteria: at a chosen hour and season, the placed bird sings at the documented rate and
stays silent when the data says it should; moving it to the wrong stratum audibly degrades it; the
player can identify it by ear using a piece and read about it at two depths; all of it works offline
and survives reload.

### Phase 2 — Curate the five (the real cost, ~1–2 weeks)
This phase is content, not code, and it is the schedule risk. Four more records at the same standard:
song variants and call notes with recordist and licence, cadence per period with citations, seasonal
presence, stratum preference, field marks, two-depth prose.

Add a **facts linter** to CI: a record with `verified:true` and a claim lacking a citation fails the
build. That is the mechanism that keeps "educational" from decaying into plausible-sounding fiction.

Exit criteria: five records, all sourced; a birder reviewing any claim can trace it to a citation.

### Phase 3 — The yard as habitat (~1 week)
Strata with real consequence (canopy, midstory, shrub, ground, feeder, bath); placement editing;
terrain and yard templates (suburban yard, woodland edge); the day dial from D8; dawn-chorus density
curve; visuals that read the light. Educational overlay: why this bird sings here, now.

### Phase 4 — Paper pieces (parked until the simulation is right)
`/t/<tokenId>` resolved from the bundled catalogue with no network call; print-ready QR sheet; first-run
flow that accepts a piece. Hardware-free, offline, and the point where "playable anywhere with the
pieces" becomes literal.

### Phase 5 — Optional game-scoped listening (only if a mechanic needs it)
Unchanged in intent and still off the critical path: DSP template matching over the five bundled
repertoires before any model, `SongDetector` behind a flag, report not merge.

### Phase 6 — Repository cleanup (½ day, by approval)
`git mv` the Python detector to `legacy/detector/`; rewrite `README.md` for Birdie; archive or delete
`phase-1` (duplicate) after confirmation. `main`'s history is never rewritten.

### Parked indefinitely (explicitly not roadmap)
NTAG215 hardware, ambient/sit-outside mode, multiple habitats beyond Phase 3, weather, migration and
flock behaviour, accounts, sync, social. `tokenId` stays in the data model so none of it is blocked —
it is simply not being built.

**What got cut in this revision.** The pared plan drops: physical NFC tokens (was Phase 3, now parked),
the ambient mode (cut entirely), and the separate "gift" item economy (D7: bird-as-gift now, item gifts
in a later phase). What it
adds instead: multiple song variants per bird, sourced cadence data, seasonal presence, habitat strata,
and a facts linter. Net effect is fewer features and much more truth per feature.

---

## 6. Decisions

**D1 — RESOLVED (Alex).** The game is primary; Birdie is not a BirdNET client. v1 identifies by ear.
Live mic detection, if it is ever built, serves the existing game pieces and discriminates only the
five catalogue species — no passive listening, no open-set identification, no model port as a goal.
Consequence: Phase 3 drops from a High-risk go/no-go spike to an optional, cheapest-first mechanic,
and the largest technical risk in the project disappears from the critical path.

**D2 — The five species.** Proposed Midwest starter set, chosen for distinct songs, backyard
familiarity, and recognizable silhouettes: American Robin, Northern Cardinal, Blue Jay, Black-capped
Chickadee, Mourning Dove. Say the word and I'll use these; otherwise give me your five.

**D3 — Content source.** Bundled real recordings vs. synthesized/free-licensed clips. This matters:
many Xeno-canto recordings are CC-BY-**NC**, which conflicts with tokens/QR and any future paid tier.
I'd use public-domain or CC0/CC-BY recordings with attribution, or generate clean clips, and store
provenance per species in the catalogue. Flagging now because it is much cheaper to fix before
assets are embedded in physical tokens.

Status (2026-11-22): public-domain material located for all five species on Wikimedia Commons, but not
enough of it (robin 3, jay 1, chickadee 1, cardinal 1, dove 0), so CC BY-SA will carry the rest, with a
credits page. Audition of the extra robin recordings is **deferred to a dedicated session** (Alex); the
robin record stays `verified: false` until someone has listened.

Robin curation session 1 (2026-11-22): 22 distinct recordings located, downloaded and SHA1-verified; the
Commons mirrors carry Xeno-canto's song/call classification, so what each file *is* is now mostly known
without ears, and a 7-minute pre-dawn recording and an evening recording gave independent measured cadence
figures. Findings, licence consequences (no plain-CC-BY tier exists in this set — BY-SA is the floor beyond
PD) and the outstanding ear work are in `docs/curation/american-robin-audio.md` and
`docs/curation/american-robin-audition.md`.

**D4 — RESOLVED (Alex): `phase-2` is archived, not merged.** Alex chose to rewrite `main` rather than
carry the Python lineage into the new product. `phase-2` is preserved read-only at
`archive/legacy-detector`, pinned by tag `legacy-detector-v0.1` at `e39b866`. `phase-1` is a
byte-identical duplicate of old `main` and is flagged for deletion once confirmed; either way its
commits remain reachable through the tag. Rationale for the force-push: zero stars, forks and watchers
meant nothing downstream breaks, and the old code was pinned under the tag before `main` moved.

**D5 — RESOLVED (Alex).** Pieces answer birdsong prompts. The app plays a song, the player answers by
placing the matching piece. On-screen pieces in Phase 1, paper QR in Phase 2, NFC in Phase 3 — all
three carry the same `tokenId`, so the input mechanism is identical across media.

**D6 — How do players get pieces?** Print-at-home sheet, or manufactured NTAG215 discs/cards? Print
keeps Phase 2 free and lets you test with five cut-out cards; manufactured pieces need a supplier and
a per-unit cost, and should not be ordered before the game is fun on paper. Default: print sheet in
Phase 2, investigate NTAG215 as a small batch only after the paper version has been played.

**D7 — What is a "gift"?** The brief says "collecting gifts and placing birds in a virtual backyard",
which can be read two ways, and Phase 1 cannot ship without choosing:
- **(i) The bird is the gift** — a correct answer earns the bird, which you then place. One currency,
  simplest, and the chorus follows immediately from collection.
- **(ii) Gifts are separate items** — a correct answer earns a thing (feeder, bath, berries) that
  attracts or houses the bird. Two currencies, more depth, more content to author, and the chorus
  becomes a property of the yard rather than of the collection.

**RESOLVED (Alex, 2026-11-22): (i) first, (ii) later.** A correct answer earns the bird, which the
player then places. Option (ii) — separate gift items that attract birds — is planned for a later
phase, not abandoned. Consequence for now: the Phase 1 schema models no inventory and no yard items,
so the species record stays purely about the bird, and the chorus follows from what has been
collected. When (ii) arrives it adds a second currency rather than replacing this one.

**D8 — RESOLVED (Alex): the clock is simulated, never real.** The app runs on its own clock that the
player controls; there is no `Date.now()` on the play path and no dependence on the device's real time
or date. Consequences:
- "Playable anywhere" is satisfied by construction — the yard is never accidentally silent because of
  the hour outside the window.
- Authenticity becomes *conditional truth*: the simulation is faithful to the conditions shown on
  screen. The UI must always state the simulated hour and season, because a fact asserted without its
  condition is the kind of lie a birder resents.
- Simulated time and season are part of saved state (`birdie.save.v1`), not ambient environment, so a
  save restores to the same morning it was left in.
- `env/clock.ts` owns advancement (dial, or a slow drift if we ever want time to pass while playing);
  `env/season.ts` derives daylight windows from the simulated date.
This removes R10 from the risk table entirely and makes the entire realism budget spendable.

**D9 — How deep does the data go, and who verifies it?**
The realism requirement multiplies content: 5 species × several song variants + calls + cadence by
period + seasonality + strata, each cited. Options: (a) I curate from public sources and mark every
claim with a citation, flagging `verified:false` where I could not confirm — honest but some entries
provisional; (b) you (or a birder you trust) review each record before it ships; (c) ship provisional
data and let players flag errors.
Recommendation: **(a) now, (b) before Phase 2 exit.** I will not invent a cadence figure to make a
record look complete; a provisional record that says so is worth more than a confident guess.

**D10 — Does wrong placement have consequences?**
If habitat is real, putting a ground-foraging bird in the canopy should matter. Proposal: wrong stratum
reduces vocalisation rate and degrades tone, and the journal explains why — the player *hears* the
mistake, then reads the reason. Alternative: placement is purely aesthetic and only the journal
teaches. I recommend consequences, because it is the cheapest way to make habitat knowledge felt
rather than read.

---

## 7. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Scope drift: mic listening quietly becomes an open-set identifier — i.e. the old repo's purpose re-enters through the back door | Medium | Detection is defined as a five-species game mechanic behind `SongDetector`; anything outside the catalogue is explicitly out of scope; no BirdNET port on any phase |
| R2 | Node 18 cannot run modern Vite | High | Phase 0 installs Node 22 LTS before any app code |
| R3 | `gh` is unauthenticated; I cannot push or open PRs | Medium | You authenticate once (`gh auth login`), or you push and I prepare commits/PR text |
| R4 | Audio licensing blocks token/commercial use | Medium | D3 decision up front; provenance recorded per species |
| R5 | Scope creep toward accounts/backend/social | Medium | "Client-side-first" is enforced by architecture; the seam is `storage/local.ts` |
| R6 | Repo/app naming divergence (`birdies` vs Birdie) | Low | Decide in Phase 5; renaming a GitHub repo is safe and preserves links |
| R7 | Physical pieces create logistics (printing, shipping, per-unit cost) before the game is proven fun | Medium | Parked: paper pieces only after the simulation is right; no hardware spend at all in the pared plan |
| R8 | **Content curation is now the critical path** — sourced cadence, variants, seasonality for five species is research work, not coding, and it is the thing most likely to slip | **High** | Phase 1 curates exactly one bird to prove the schema; Phase 2 is scheduled as a content phase with a facts linter; `verified:false` lets progress continue without asserting unverified claims |
| R9 | **Plausible-sounding fiction** — invented cadence or habitat details that a birder spots instantly, destroying the app's credibility with its stated core audience | **High** | Per-claim citations, `verified` flag rendered in the UI, facts linter in CI, and a rule I hold myself to: no number ships without a source |
| R10 | Authenticity makes the yard silent and the game feel broken | ~~High~~ **Removed** | Resolved by D8: the clock is simulated, so silence is always a choice the player made, never an accident of when they opened the app |

---

## 8. Summary

The repository is a **working Python prototype of a backyard microphone detector** with good
threshold tuning, a duplicate `phase-1` branch, and an unmerged `phase-2` that adds SQLite
persistence and a stock React template. It contains **no UI, no game, no audio, no model, and no
assets** relevant to Birdie.

Therefore: **the new app is new code**, and the transition is best done as an additive `web/`
application on a short-lived feature branch, preserving all history and leaving `main` intact. The
only genuine legacy value is the detection-gating knowledge — kept as reference and reachable behind
one narrow interface, so that a later listening mechanic can be added or abandoned without
endangering the shipped game. Nothing in the product depends on reproducing BirdNET.

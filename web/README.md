# Birdie — web app

Client-side game. No backend, no accounts, no runtime network calls: the yard has
to work with the radio off.

    cd web
    npm install
    npm run dev        # http://localhost:5173

    npm run check      # typecheck → lint → test → build (what CI will run)

## What exists

Phase 1 of [the transition plan](../docs/birdie-transition-plan.md) is in progress.

| Area | State |
|---|---|
| `src/env/` — simulated clock, season, daylight, time-of-day period | **done, tested** |
| `src/species/` — record schema, validator, licence gate, generated credits, the American Robin | **one provisional record, tested** |
| `src/sim/` — cadence, variants, event simulation (one seeded stream per bird), scheduler | **done, tested** |
| `src/app/` — clock shell, credits and licences screen | **done, tested** (the button's click path is not covered by a test) |
| `src/audio/` — Web Audio engine and look-ahead scheduling | not written |
| `src/pieces/`, `src/game/`, `src/backyard/`, `src/journal/`, `src/storage/` | not written |
| PWA precache (`vite-plugin-pwa`) | not added yet — needs the audio assets first |

Progress and todos are in the GitHub tracker, not in this file.

`public/audio/` builds from the originals via `bash scripts/prepare-audio.sh`,
which pins each source's SHA-256 and trim points so every shipped second is
reproducible. The cadence figures in the robin record were counted from the file
that script rebuilds — if a source changes upstream the script fails rather than
silently shipping different audio than the numbers describe.

## Two rules this codebase holds

1. **The clock is simulated (D8).** Nothing on the play path reads the device
   time. `Date.now()`, `new Date()` and `Math.random()` are banned in the core and
   a test enforces it, because the same ban is what makes the simulation
   deterministic and therefore testable.
2. **No fact without a source.** Once species records land, a claim with
   `verified: true` must carry a citation; the facts linter (Phase 2) fails the
   build otherwise. A provisional record that says so beats a confident guess.

## Toolchain

Node ≥ 20 (developed on 22). npm, not bun. Stack and rejected alternatives are
justified in plan §4.

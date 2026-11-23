# Birdie

A cozy, offline-first birdsong game for phones.

You hear a bird sing, you answer with a piece — a card on screen, a printed card, or eventually an
NFC token — and the bird moves into your backyard. The backyard is not a playlist: each bird sings at
a rate taken from real data, gated by time of day and season, choosing among its real song types from
the habitat layer it actually occupies. The result is meant to be honest enough for a hardcore birder
and gentle enough for a child.

No accounts, no backend, no network required after first load.

## Status

**Phase 1 in progress.** The web app lives in [`web/`](web/README.md): the simulated clock, one provisional
species record, the cadence and event model, and a credits screen. Audio playback, pieces, the backyard and
the journal are not built yet. Open work is tracked in the GitHub issues.

The product direction, architecture decisions, phased plan and open questions live in:

- [`docs/birdie-transition-plan.md`](docs/birdie-transition-plan.md)

## Legacy

This repository previously held a Python backyard bird detector (microphone → Silero VAD → BirdNET →
JSONL). It is not part of Birdie and is preserved, read-only, at:

- branch `archive/legacy-detector`
- tag `legacy-detector-v0.1`

The detection thresholds and the two-window confirmation heuristic from that work are documented in the
transition plan; nothing else carried over, because the new product is a client-side TypeScript
application with no microphone requirement.

## License

CC0-1.0, carried over from the original repository.

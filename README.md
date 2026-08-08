# Birdies

Local bird audio detection using microphone input, Silero VAD, and BirdNET.

The repository is organized as a small full-stack monorepo:

```text
backend/   Python audio capture, analysis, storage, and tests
frontend/  React, TypeScript, Vite, and Oxlint application
```

## Quick Start

### Prerequisites

- Python 3.10 or 3.11
- uv
- Bun
- A working microphone input

### Setup

```bash
uv sync --directory backend
```

> **macOS note:** `tflite-runtime` has no macOS wheels. The repo includes `backend/src/tflite_runtime/`
> as a shim that routes through `ai-edge-litert` instead. The `pyproject.toml` pins the right
> package for each platform automatically.

If configuration is needed, copy `backend/.env.example` to `backend/.env`.

### Run

```bash
uv --directory backend run python src/main.py
```

### Test

```bash
uv --directory backend run pytest
```

### Rebuild Observations

```bash
uv --directory backend run python src/rebuild_observations.py
```

To rebuild a single session:

```bash
uv --directory backend run python src/rebuild_observations.py --session-id 2
```

## Platform Notes

- **macOS (development):** `backend/src/tflite_runtime/` shims birdnetlib to use `ai-edge-litert`.
  Tests for the full analysis pipeline pass here. The `required-environments` in
  `backend/pyproject.toml` constrains `uv sync` to macOS.

- **Linux (server/deploy):** `tflite-runtime` from pip works natively. The `backend/src/tflite_runtime/`
  shim directory shadows the real package, so analysis tests that import birdnetlib won't
  run on Linux. Buffer-only tests (`backend/tests/test_audio_ring_buffer.py`) work fine on both.

## Development Layout

Run backend commands from the repository root using `uv --directory backend ...`, or change
into `backend/` and use the shorter `uv ...` form. Frontend commands run from `frontend/`.

### Frontend Setup

The frontend uses Bun, React, TypeScript, Vite, React Compiler, and Oxlint. After cloning the
repository, install its dependencies with:

```bash
cd frontend
bun install
bun run dev
```

Run frontend checks with:

```bash
bun run lint
bun run build
```

The frontend streams microphone audio to the backend over WebSocket. The backend currently
provides the detector and persistence layer; the streaming endpoint is the next integration step.

# Birdies

Local bird audio detection using microphone input, Silero VAD, and BirdNET.

## Quick Start

### Prerequisites

- Python 3.10 or 3.11
- uv
- A working microphone input

### Setup

```bash
uv sync
```

> **macOS note:** `tflite-runtime` has no macOS wheels. The repo includes `src/tflite_runtime/`
> as a shim that routes through `ai-edge-litert` instead. The `pyproject.toml` pins the right
> package for each platform automatically.

### Run

```bash
uv run python src/main.py
```

### Test

```bash
uv run pytest
```

## Platform Notes

- **macOS (development):** `src/tflite_runtime/` shims birdnetlib to use `ai-edge-litert`.
  Tests for the full analysis pipeline pass here. The `required-environments` in
  `pyproject.toml` constrains `uv sync` to macOS.

- **Linux (server/deploy):** `tflite-runtime` from pip works natively. The `src/tflite_runtime/`
  shim directory shadows the real package, so analysis tests that import birdnetlib won't
  run on Linux. Buffer-only tests (`tests/test_audio_ring_buffer.py`) work fine on both.

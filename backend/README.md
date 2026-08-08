# Birdies backend

The backend is a local, long-running bird-audio detector. It reads audio from the
machine's default microphone, analyzes it locally, and persists analysis results to
SQLite. It does not currently expose an HTTP or WebSocket API.

## Requirements

- Python 3.10 or 3.11
- [uv](https://docs.astral.sh/uv/)
- A working microphone and audio input permissions

Install the backend dependencies from the repository root:

```bash
uv sync --directory backend
```

## Run the detector

```bash
uv --directory backend run python src/main.py
```

The process runs continuously until it is interrupted. On shutdown it stops the
audio stream and closes the active database session.

By default, data is stored at:

```text
~/.birdie/birdies.sqlite
```

`create_analyzer(path=...)` can be used by callers and tests to select another data
directory. The command-line worker currently uses the default location.

## Configuration

Environment variables are loaded with `python-dotenv`. Optional session coordinates
can be provided as:

```dotenv
BIRDIES_LATITUDE=41.8781
BIRDIES_LONGITUDE=-87.6298
```

Both values must be present to be recorded; otherwise the session has no coordinates.

## Analysis pipeline

Every three seconds the worker reads the latest three seconds of 48 kHz, mono audio.
The pipeline:

1. Captures microphone input with `sounddevice` into a thread-safe ring buffer.
2. Skips the window until the buffer is full.
3. Records `silence` when RMS audio is below `0.005`.
4. Uses Silero VAD to estimate human speech. Windows with a speech ratio above
   `0.7` are recorded as `human_speech` and are not sent to BirdNET.
5. Runs BirdNET on the remaining windows.
6. Keeps detections with confidence at least `0.75`. Detections below `0.9` must
   appear in consecutive analysis windows before they are confirmed.
7. Stores the window and updates species-level observations for confirmed birds.

Analysis windows are labeled `silence`, `human_speech`, `birds`, or `no_birds`.

## Storage

The SQLite database is initialized and migrated automatically. Its main entities are:

- `users` — the local user record.
- `sessions` — one record for each detector run, including optional coordinates.
- `detection_windows` — every analyzed window, its state, speech ratio, and BirdNET
  detections as JSON.
- `observations` — aggregated species detections derived from accepted windows.

Detection windows support `accepted` and `rejected` review states. Rejected windows
are retained but do not contribute to aggregated observations.

Rebuild observations after changing or reviewing detection windows:

```bash
uv --directory backend run python src/rebuild_observations.py
```

Use a custom database or rebuild one session only:

```bash
uv --directory backend run python src/rebuild_observations.py \
  --db-path /path/to/birdies.sqlite \
  --session-id 2
```

## Tests

```bash
uv --directory backend run pytest
```

Tests cover the audio ring buffer, analysis decisions, SQLite persistence, review
states, and observation rebuilding.

## Project layout

```text
src/main.py                  Worker entry point and session lifecycle
src/record/                  Audio capture, buffering, VAD, and BirdNET analysis
src/storage/db.py            SQLite schema, persistence, and aggregation
src/rebuild_observations.py  Observation rebuild CLI
tests/                       Backend test suite
```

## Platform note

On macOS, `tflite-runtime` is replaced by `ai-edge-litert`, with the compatibility
shim in `src/tflite_runtime/`. On other platforms the project declares
`tflite-runtime` directly. See `pyproject.toml` for the platform-specific dependency
constraints.

## Current limitations

- The backend is a local worker, not a web server.
- The frontend-to-backend microphone streaming integration is not implemented yet.
- Audio is analyzed in memory; raw recordings are not persisted.
- The worker currently uses the default system input selected by `sounddevice`.

## Quick Start

### Prerequisites

- Python 3.10 or 3.11
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Bun](https://bun.sh/) (JavaScript runtime and package manager)
- A working microphone input

## Setup

```bash
git clone git@github.com:WorldsAreYours/birdies.git
cd birdies
uv sync --directory backend
```

## Run

```bash
uv --directory backend run python src/main.py
```

## Test

```bash
uv --directory backend run pytest
```

## Frontend

Install and run the React client from the repository root:

```bash
cd frontend
bun install
bun run dev
```

The frontend is scaffolded with TypeScript, React Compiler, and Oxlint. Frontend checks can be
run with:

```bash
bun run lint
bun run build
```

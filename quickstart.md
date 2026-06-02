## Quick Start

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [LiveKit Cloud](https://livekit.cloud) account (free tier)
- GitHub SSH key or deploy key

## Setup

```bash
# Clone
git clone git@github.com:WorldsAreYours/birdies.git
cd birdies

# Install deps
uv sync
source .venv/bin/activate

# Credentials
cp .env.example .env.local
```

Fill in `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` in `.env.local`.

## Run the Agent

```bash
cd ~/birdie
source .venv/bin/activate
python -m src.agent
```

import asyncio
import os
from datetime import datetime, timezone

from dotenv import load_dotenv

from record.analysis import Analysis
from record.audio_ring_buffer import AudioRingBuffer
from record.recorder import Recorder
from storage.db import Database

load_dotenv()

ANALYSIS_INTERVAL_SECONDS = 3
SAMPLE_RATE = 48000
BUFFER_SECONDS = 3
BLOCK_SIZE = 3840
ACTIVE_STATE = False


def _load_session_coordinates() -> tuple[float | None, float | None]:
    latitude = os.getenv("BIRDIES_LATITUDE")
    longitude = os.getenv("BIRDIES_LONGITUDE")

    if latitude is None or longitude is None:
        return None, None

    return float(latitude), float(longitude)


def create_analyzer(path: str | None = None) -> tuple[Recorder, Analysis, Database, int]:
    data_path = path or os.path.expanduser("~/.birdie")
    os.makedirs(data_path, exist_ok=True)

    database = Database(os.path.join(data_path, "birdies.sqlite"))
    database.initialize_schema()
    existing_user = database.connect().execute("select id from users order by id limit 1").fetchone()
    user_id = int(existing_user["id"]) if existing_user is not None else database.create_user()
    latitude, longitude = _load_session_coordinates()
    session_id = database.create_session(
        user_id,
        started_at=datetime.now(timezone.utc),
        latitude=latitude,
        longitude=longitude,
    )

    buffer = AudioRingBuffer(SAMPLE_RATE, BUFFER_SECONDS)
    recorder = Recorder(SAMPLE_RATE, "float32", blocksize=BLOCK_SIZE, callback=buffer)
    analyzer = Analysis(buffer, database, session_id)

    return recorder, analyzer, database, session_id


async def analysis_loop(analyzer: Analysis) -> None:
    global ACTIVE_STATE
    while True:
        started_at = asyncio.get_running_loop().time()
        if not ACTIVE_STATE:
            await analyzer.noise_analysis()

        elapsed = asyncio.get_running_loop().time() - started_at
        await asyncio.sleep(max(0, ANALYSIS_INTERVAL_SECONDS - elapsed))


async def main() -> None:
    recorder, analyzer, database, session_id = create_analyzer()
    stream = recorder.get_stream()
    try:
        stream.start()
        await analysis_loop(analyzer)
    finally:
        stream.stop()
        stream.close()
        database.end_session(session_id, ended_at=datetime.now(timezone.utc))
        database.close()


if __name__ == "__main__":
    asyncio.run(main())

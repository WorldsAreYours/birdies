import asyncio
import os
from dotenv import load_dotenv
from record.recorder import Recorder
from record.audio_ring_buffer import AudioRingBuffer
from record.analysis import Analysis

load_dotenv()

ANALYSIS_INTERVAL_SECONDS = 3
SAMPLE_RATE = 48000
BUFFER_SECONDS = 3
BLOCK_SIZE = 3840


def create_analyzer(path: str | None = None) -> tuple[Recorder, Analysis]:
    data_path = path or os.path.expanduser('~/.birdie')
    os.makedirs(data_path, exist_ok=True)

    buffer = AudioRingBuffer(SAMPLE_RATE, BUFFER_SECONDS)
    recorder = Recorder(SAMPLE_RATE, 'float32', blocksize=BLOCK_SIZE, callback=buffer)
    analyzer = Analysis(buffer, data_path)

    return recorder, analyzer


async def analysis_loop(analyzer: Analysis) -> None:
    while True:
        started_at = asyncio.get_running_loop().time()

        await analyzer.noise_analysis()

        elapsed = asyncio.get_running_loop().time() - started_at
        await asyncio.sleep(max(0, ANALYSIS_INTERVAL_SECONDS - elapsed))


async def main() -> None:
    recorder, analyzer = create_analyzer()
    stream = recorder.get_stream()
    try:
        stream.start()
        await analysis_loop(analyzer)
    finally:
        stream.stop()
        stream.close()


if __name__ == "__main__":
    asyncio.run(main())

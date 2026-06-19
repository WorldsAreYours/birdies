import asyncio
import os
from dotenv import load_dotenv
from record.recorder import Recorder
from record.audio_ring_buffer import AudioRingBuffer
from record.analysis import Analysis

load_dotenv()

ANALYSIS_INTERVAL_SECONDS = 3

path = os.path.expanduser('~/.birdie')
os.makedirs(path, exist_ok=True)
buffer = AudioRingBuffer(48000, 3)

recorder = Recorder(48000, 'float32', blocksize=3840, callback=buffer)

analyzer = Analysis(buffer, path)

# create audio stream
# read from stream for openwakeword
# read from buffer for silero


async def analysis_loop():
    while True:
        started_at = asyncio.get_running_loop().time()

        await analyzer.noise_analysis()

        elapsed = asyncio.get_running_loop().time() - started_at
        await asyncio.sleep(max(0, ANALYSIS_INTERVAL_SECONDS - elapsed))


async def main():
    stream = recorder.getStream()
    try:
        stream.start()
        await analysis_loop()
    finally:
        stream.stop()
        stream.close()


if __name__ == "__main__":
    asyncio.run(main())

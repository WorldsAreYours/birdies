import asyncio
import numpy as np
import io
import os
from dotenv import load_dotenv
import sounddevice as sd
from record.recorder import Recorder
from record.audio_ring_buffer import AudioRingBuffer
from record.detection import Detection
from record.analysis import Analysis

load_dotenv()

path = os.path.expanduser('~/.birdie')
buffer = AudioRingBuffer(48000, 3)

recorder = Recorder(48000, 'float32', blocksize=3840, callback=buffer)

analyzer = Analysis(buffer, path)

# create audio stream
# read from stream for openwakeword
# read from buffer for silero


async def main():
    stream = recorder.getStream()
    stream.start()

    await asyncio.gather()

if __name__ == "__main__":
    asyncio.run(main())
    asyncio.run(analyzer.noise_analysis())
import asyncio
import io
import os
from dotenv import load_dotenv
import sounddevice as sd
from record.recorder import Recorder
from record.audio_ring_buffer import AudioRingBuffer
from record.detection import Detection

load_dotenv()

path = os.path.expanduser('~/.birdie')
buffer = AudioRingBuffer(path)

recorder = Recorder(48000, 10, 'float32', blocksize=512*3, callback=buffer)

async def main():
    stream = recorder.getStream()
    stream.start()

    await asyncio.gather()

if __name__ == "__main__":

    # os.makedirs(path, exist_ok=True)
    
    # with recorder.stream:
    #     sd.sleep(6000)
    # birds = [Detection(bird) for bird  in buffer.detections]
    # for bird in birds:
    #     cur = bird.getBird()


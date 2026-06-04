import io
import os
from dotenv import load_dotenv
import sounddevice as sd
import sys; print(sys.path)
from sounddevice import RawInputStream
from record.recorder import Recorder
from record.audiobuffer import AudioBuffer

load_dotenv()

buffer = AudioBuffer()

recorder = Recorder(48000, 10, 'float32', blocksize=512*3, callback=buffer)
print(type(recorder.stream))

if __name__ == "__main__":
    print('ok')
    with recorder.stream:
        sd.sleep(5000)

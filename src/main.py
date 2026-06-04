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

recorder = Recorder(48000, 10, 'float32', callback=buffer)
print(type(recorder.stream))
with recorder.stream:
    sd.sleep(5000)

if __name__ == "main":
    recorder.start()
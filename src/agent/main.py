import io
import os
from dotenv import load_dotenv
import sounddevice as sd
from sounddevice import RawInputStream
from record.recorder import Recorder
from record.audiobuffer import AudioBuffer

load_dotenv()

buffer = AudioBuffer()

recorder = Recorder(48000, 10, 'float32', callback=buffer)

with recorder.stream:
    sd.sleep(5000)
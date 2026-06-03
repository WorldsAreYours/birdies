
import sounddevice as sd

class Recorder:
    def __init__(self, fs, duration, dtype, callback):
        self.callback = callback
        self.seconds = 0
        self.stream = sd.RawInputStream(samplerate=fs, dtype=dtype, latency='low', channels=1, callback=self.callback)
    
    def start(self):
        self.stream.start()

    def stop(self):
        self.stream.stop()

    def close(self):
        self.stream.close()
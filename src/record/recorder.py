import sounddevice as sd

class Recorder:
    def __init__(self, fs, duration, dtype, blocksize, callback):
        self.callback = callback
        self.stream = sd.RawInputStream(samplerate=fs, dtype=dtype, latency='low', channels=1, blocksize=blocksize, callback=self.callback)
    
    def start(self):
        self.stream.start()

    def stop(self):
        self.stream.stop()

    def close(self):
        self.stream.close()
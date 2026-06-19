import sounddevice as sd

class Recorder:
    def __init__(self, fs, dtype, blocksize, callback) -> None:
        self.callback = callback
        self.stream = sd.InputStream(samplerate=fs, dtype=dtype, latency='low', channels=1, blocksize=blocksize, callback=self.callback)
    
    def getStream(self) -> sd.InputStream:
        return self.stream

    def start(self) -> None:
        self.stream.start()

    def stop(self) -> None:
        self.stream.stop()

    def close(self) -> None:
        self.stream.close()
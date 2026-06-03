class AudioBuffer:
    def __init__(self):
        self.data = bytearray()
        self.samplerate = 48000
        self.duration = 3
        self.bytes_per_sample = 4
    
    def __call__(self, indata, frames, time, status):
        self.data.extend(indata)
        if len(self.data) >= self.samplerate * self.duration * self.bytes_per_sample:
            print(f"birdnet is ready for these {len(self.data)} frames")
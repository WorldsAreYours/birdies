from silero_vad import load_silero_vad, read_audio, get_speech_timestamps
from librosa import resample

class AudioBuffer:
    def __init__(self):
        self.data = bytearray()
        self.samplerate = 48000
        self.duration = 3
        self.bytes_per_sample = 4
        model = load_silero_vad()
    
    def __call__(self, indata, frames, time, status):
        self.data.extend(indata)
        if len(self.data) >= self.samplerate * self.duration * self.bytes_per_sample:

            # resample
            # resample()
            print(f"birdnet is ready for these {len(self.data)} frames")
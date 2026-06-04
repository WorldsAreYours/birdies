from silero_vad import load_silero_vad, read_audio, get_speech_timestamps
from librosa import resample
from numpy import frombuffer
from torch import from_numpy

class AudioBuffer:
    def __init__(self):
        self.data = bytearray()
        self.samplerate = 48000
        self.duration = 3
        self.bytes_per_sample = 4
        
        self.model = load_silero_vad()
    
    def __call__(self, indata, frames, time, status):
        n = 512
        
        if len(self.data) >= self.samplerate * self.duration * self.bytes_per_sample:
            # resample(y=self.data, orig_sr=self.samplerate, target_sr=self.samplerate/3)
            print(f"birdnet is ready for these {type(self.data)}\n ")
            print(f"indata {type(indata)} \n{indata}")
        else:
            self.data.extend(indata)
        npArrayBuffer = frombuffer(indata, 'float32')
        downSampled = resample(npArrayBuffer, orig_sr=self.samplerate, target_sr=self.samplerate//3)
        chunks = [downSampled[i : i + n] for i in range(0, len(downSampled), n)]
        tensor_arr = from_numpy(chunks)

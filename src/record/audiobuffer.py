from silero_vad import load_silero_vad, read_audio, get_speech_timestamps
from librosa import resample
from numpy import frombuffer
from torch import from_numpy
from birdnet import Birdnet

class AudioBuffer:
    def __init__(self):
        self.data = bytearray()
        self.samplerate = 48000
        self.duration = 3
        self.bytes_per_sample = 4
        self.birdnet = Birdnet()
        self.model = load_silero_vad()
    
    def __call__(self, indata, frames, time, status):
        n = 512

        if len(self.data) >= self.samplerate * self.duration * self.bytes_per_sample:
            # feed to birdnet
            # reset?
            

            npArrayBuffer = frombuffer(self.data, 'float32')
            
            downSampled = resample(npArrayBuffer, orig_sr=self.samplerate, target_sr=self.samplerate//3)
            chunks = [from_numpy(downSampled[i : i + n]).reshape((1, n)) for i in range(0, len(downSampled) - n + 1, n)]
            human_count = 0
            bird_count = 0
            for chunk in chunks:
                probability = self.model(chunk, self.samplerate//3).item()
                
                if probability < 0.5:
                    bird_count += 1
                else:
                    human_count += 1
            if human_count / (bird_count + human_count) <= 0.3:
                print('bird away')
                self.birdnet.analyze(npArrayBuffer, self.samplerate)
            else:
                print('eww humans')
            self.data = bytearray()
        else:
            self.data.extend(indata)


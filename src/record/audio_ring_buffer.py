import os
import numpy as np

class AudioRingBuffer:
    def __init__(self, sample_rate: int = 48000, duration_seconds: int = 3) -> None:
        self.sample_rate = sample_rate
        self.duration_seconds = duration_seconds
        self.capacity = self.sample_rate * self.duration_seconds
        self.buffer = np.zeros(self.capacity, dtype=np.float32)
    
    """
    Callable audio buffer. Passed directly to sounddevice InputStream as callback.
    Sounddevice calls __call__(indata, frames, time, status) on each audio chunk.
    """
    def __call__(self, indata, frames, time, status):
        n = 512

        if len(self.data) >= self.sample_rate * self.duration_seconds * self.bytes_per_sample:
            downSampled = resample(npArrayBuffer, orig_sr=self.sample_rate, target_sr=self.sample_rate//3)
            chunks = [from_numpy(downSampled[i : i + n]).reshape((1, n)) for i in range(0, len(downSampled) - n + 1, n)]
            human_count = 0
            bird_count = 0
            for chunk in chunks:
                human_sound = self.model(chunk, self.sample_rate//3).item()
                
                if human_sound < 0.5:
                    bird_count += 1
                else:
                    human_count += 1
            if human_count / (bird_count + human_count) <= 0.5:
                birds = self.birdnet.analyze(npArrayBuffer, self.sample_rate)
                
                with open(os.path.join(self.path, "timeline.jsonl"), "a") as file:
                    for bird in birds:
                        bird['timestamp'] = datetime.now().isoformat()
                        file.write(json.dumps(bird) + "\n")

                self.detections.extend(birds)
                


            else:
                print('eww humans')
            self.data = bytearray()
        else:
            self.data.extend(indata)


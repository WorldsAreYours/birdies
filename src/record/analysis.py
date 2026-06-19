import os
import json
from datetime import datetime
from silero_vad import load_silero_vad, read_audio, get_speech_timestamps
from audio_ring_buffer import AudioRingBuffer
from birdnet import Birdnet


class Analysis:
        def __init__(self, audio_buffer: AudioRingBuffer, path) -> None:
            self.audio_buffer = audio_buffer
            self.model = load_silero_vad()
            self.birdnet = Birdnet()
            self.path = path
            self.detections = []

        async def noise_analysis(self) -> None:
            human_count = 0
            bird_count = 0
            sample_rate = self.audio_buffer.getSampleRate()
            self.buffer = self.audio_buffer.getBuffer()

            for chunk in self.buffer:
                human_sound = self.model(chunk, sample_rate//3).item()
                
                if human_sound < 0.5:
                    bird_count += 1
                else:
                    human_count += 1
            if human_count / (bird_count + human_count) <= 0.5:
                birds = self.birdnet.analyze(self.buffer, sample_rate)
                
                with open(os.path.join(self.path, "timeline.jsonl"), "a") as file:
                    for bird in birds:
                        bird['timestamp'] = datetime.now().isoformat()
                        file.write(json.dumps(bird) + "\n")

                self.detections.extend(birds)
            else:
                print('eww humans')
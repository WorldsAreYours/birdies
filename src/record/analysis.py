import asyncio
import os
import json
from datetime import datetime
import torch
from silero_vad import load_silero_vad
from record.audio_ring_buffer import AudioRingBuffer
from record.birdnet import Birdnet

SPEECH_PROBABILITY_THRESHOLD = 0.5
SPEECH_RATIO_THRESHOLD = 0.7


class Analysis:
        def __init__(self, audio_buffer: AudioRingBuffer, path) -> None:
            self.audio_buffer = audio_buffer
            self.model = load_silero_vad()
            self.birdnet = Birdnet()
            self.path = path
            self.detections = []

        async def noise_analysis(self) -> None:
            sample_rate = self.audio_buffer.getSampleRate()
            self.buffer = self.audio_buffer.read_latest()

            if self.buffer is None:
                print('waiting for audio buffer to fill')
                return

            human_ratio = self._human_speech_ratio(self.buffer, sample_rate)

            if human_ratio <= SPEECH_RATIO_THRESHOLD:
                birds = asyncio.get_running_loop().run_in_executor(None, self.birdnet.analyze, self.buffer, sample_rate)
                
                with open(os.path.join(self.path, "timeline.jsonl"), "a") as file:
                    for bird in birds:
                        bird['timestamp'] = datetime.now().isoformat()
                        file.write(json.dumps(bird) + "\n")

                self.detections.extend(birds)
                print(f'birds, great. ({1-human_ratio:.0%} bird sounds)')
            else:
                print(f'eww humans ')

        def _human_speech_ratio(self, buffer, sample_rate: int) -> float:
            window_size = 512 if sample_rate == 16000 else 1536
            audio = torch.from_numpy(buffer.copy())
            total_count = 0
            human_count = 0

            for start in range(0, len(audio) - window_size + 1, window_size):
                chunk = audio[start:start + window_size]
                speech_probability = self.model(chunk, sample_rate).item()
                total_count += 1

                if speech_probability > SPEECH_PROBABILITY_THRESHOLD:
                    human_count += 1

            if total_count == 0:
                return 0

            return human_count / total_count

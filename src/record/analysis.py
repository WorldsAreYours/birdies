from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime
from os import PathLike

import torch
from silero_vad import load_silero_vad

from record.audio_ring_buffer import AudioRingBuffer
from record.birdnet import Birdnet

SPEECH_PROBABILITY_THRESHOLD = 0.5
SPEECH_RATIO_THRESHOLD = 0.7


class Analysis:
    def __init__(
        self,
        audio_buffer: AudioRingBuffer,
        path: str | PathLike[str],
        model=None,
        birdnet: Birdnet | None = None,
    ) -> None:
        self.audio_buffer = audio_buffer
        self.model = model or load_silero_vad()
        self.birdnet = birdnet or Birdnet()
        self.path = os.fspath(path)
        self.detections = []

    async def noise_analysis(self) -> None:
        sample_rate = self.audio_buffer.get_sample_rate()
        audio = self.audio_buffer.read_latest()

        if audio is None:
            print("waiting for audio buffer to fill")
            return

        human_ratio = self._human_speech_ratio(audio, sample_rate)

        if human_ratio > SPEECH_RATIO_THRESHOLD:
            print("eww humans")
            return

        birds = await asyncio.get_running_loop().run_in_executor(
            None,
            self.birdnet.analyze,
            audio,
            sample_rate,
        )

        self._record_detections(birds)
        print(f"birds, great. ({1-human_ratio:.0%} bird sounds)")

    def _record_detections(self, birds: list[dict]) -> None:
        with open(os.path.join(self.path, "timeline.jsonl"), "a") as file:
            for bird in birds:
                bird["timestamp"] = datetime.now().isoformat()
                file.write(json.dumps(bird) + "\n")

        self.detections.extend(birds)

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

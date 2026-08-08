from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import numpy as np
import torch
from silero_vad import load_silero_vad

from record.audio_ring_buffer import AudioRingBuffer
from record.birdnet import Birdnet

SPEECH_PROBABILITY_THRESHOLD = 0.5
SPEECH_RATIO_THRESHOLD = 0.7
SILENCE_RMS_THRESHOLD = 0.005
MIN_BIRD_CONFIDENCE = 0.75
IMMEDIATE_BIRD_CONFIDENCE = 0.9


class Analysis:
    def __init__(
        self,
        audio_buffer: AudioRingBuffer,
        store,
        session_id: int,
        model=None,
        birdnet: Birdnet | None = None,
    ) -> None:
        self.audio_buffer = audio_buffer
        self.store = store
        self.session_id = session_id
        self.model = model or load_silero_vad()
        self.birdnet = birdnet or Birdnet()
        self.detections: list[dict] = []
        self.pending_birds: dict[str, dict] = {}
        self.window_sequence = 0

    async def noise_analysis(self) -> None:
        sample_rate = self.audio_buffer.get_sample_rate()
        audio = self.audio_buffer.read_latest()

        if audio is None:
            print("waiting for audio buffer to fill")
            return

        self.window_sequence += 1
        observed_at = datetime.now(timezone.utc)
        audio_rms = self._audio_rms(audio)

        if audio_rms < SILENCE_RMS_THRESHOLD:
            self.store.record_analysis_pass(
                session_id=self.session_id,
                sequence_number=self.window_sequence,
                observed_at=observed_at,
                birds=[],
                human_speech_ratio=0,
                analysis_state="silence",
            )
            print(f"too quiet for analysis (rms={audio_rms:.4f})")
            return

        human_ratio = self._human_speech_ratio(audio, sample_rate)

        if human_ratio > SPEECH_RATIO_THRESHOLD:
            self.store.record_analysis_pass(
                session_id=self.session_id,
                sequence_number=self.window_sequence,
                observed_at=observed_at,
                birds=[],
                human_speech_ratio=human_ratio,
                analysis_state="human_speech",
            )
            print("eww humans")
            return

        birds = await asyncio.get_running_loop().run_in_executor(
            None,
            self.birdnet.analyze,
            audio,
            sample_rate,
        )
        birds = self._filter_birds(birds)
        birds = self._confirm_birds(birds)

        if birds:
            self._record_detections(birds)

        self.store.record_analysis_pass(
            session_id=self.session_id,
            sequence_number=self.window_sequence,
            observed_at=observed_at,
            birds=birds,
            human_speech_ratio=human_ratio,
            analysis_state="birds" if birds else "no_birds",
        )
        print(f"birds, great. ({1-human_ratio:.0%} bird sounds)")

    def _audio_rms(self, buffer: np.ndarray) -> float:
        return float(np.sqrt(np.mean(np.square(buffer, dtype=np.float32), dtype=np.float32)))

    def _filter_birds(self, birds: list[dict]) -> list[dict]:
        filtered: list[dict] = []
        for bird in birds:
            confidence = bird.get("confidence")
            if confidence is None or confidence >= MIN_BIRD_CONFIDENCE:
                filtered.append(bird)
        return filtered

    def _confirm_birds(self, birds: list[dict]) -> list[dict]:
        confirmed: list[dict] = []
        next_pending: dict[str, dict] = {}

        for bird in birds:
            species = bird.get("common_name")
            if not species:
                continue

            confidence = bird.get("confidence")
            if confidence is None or confidence >= IMMEDIATE_BIRD_CONFIDENCE:
                confirmed.append(bird)
                continue

            previous_bird = self.pending_birds.get(species)
            if previous_bird is not None:
                confirmed.append(bird)
                continue

            next_pending[species] = bird

        self.pending_birds = next_pending
        return confirmed

    def _record_detections(self, birds: list[dict]) -> None:
        timestamp = datetime.now(timezone.utc).isoformat()
        for bird in birds:
            stored_bird = bird.copy()
            stored_bird["timestamp"] = timestamp
            self.detections.append(stored_bird)

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

import asyncio
from datetime import datetime, timezone
from typing import Any, cast

import numpy as np

from record.analysis import Analysis
from record.audio_ring_buffer import AudioRingBuffer
from record.birdnet import Birdnet


class FakeTensor:
    def __init__(self, samples: np.ndarray):
        self.samples = samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, item: slice) -> "FakeTensor":
        return FakeTensor(self.samples[item])


class FakeProbability:
    def __init__(self, value: float):
        self.value = value

    def item(self) -> float:
        return self.value


class FakeVadModel:
    def __init__(self, probabilities: list[float]):
        self.probabilities = list(probabilities)
        self.calls: list[tuple[FakeTensor, int]] = []

    def __call__(self, chunk: FakeTensor, sample_rate: int) -> FakeProbability:
        self.calls.append((chunk, sample_rate))
        return FakeProbability(self.probabilities.pop(0))


class FakeBirdnet:
    def __init__(self, detections: list[dict[str, Any]] | None = None):
        self.detections = detections or []
        self.calls: list[tuple[np.ndarray, int]] = []

    def analyze(self, buffer: np.ndarray, sample_rate: int) -> list[dict[str, Any]]:
        self.calls.append((buffer, sample_rate))
        return [detection.copy() for detection in self.detections]


class FakeObservationStore:
    def __init__(self):
        self.calls: list[dict[str, Any]] = []

    def record_analysis_pass(
        self,
        *,
        session_id: int,
        sequence_number: int,
        observed_at: datetime,
        birds: list[dict[str, Any]],
        human_speech_ratio: float,
        analysis_state: str,
    ) -> int:
        self.calls.append(
            {
                "session_id": session_id,
                "sequence_number": sequence_number,
                "observed_at": observed_at,
                "birds": birds,
                "human_speech_ratio": human_speech_ratio,
                "analysis_state": analysis_state,
            }
        )
        return sequence_number


def test_human_speech_ratio_counts_windows_above_threshold(monkeypatch):
    monkeypatch.setattr("record.analysis.torch.from_numpy", lambda samples: FakeTensor(samples))
    vad_model = FakeVadModel([0.6, 0.5, 0.9])
    audio_buffer = AudioRingBuffer(sample_rate=16000, duration_seconds=1)
    analyzer = Analysis(audio_buffer, FakeObservationStore(), session_id=1, model=vad_model, birdnet=cast(Birdnet, FakeBirdnet()))

    ratio = analyzer._human_speech_ratio(np.zeros(1536, dtype=np.float32), 16000)

    assert ratio == 2 / 3
    assert [sample_rate for _, sample_rate in vad_model.calls] == [16000, 16000, 16000]


def test_human_speech_ratio_returns_zero_when_audio_is_shorter_than_window(monkeypatch):
    monkeypatch.setattr("record.analysis.torch.from_numpy", lambda samples: FakeTensor(samples))
    audio_buffer = AudioRingBuffer(sample_rate=16000, duration_seconds=1)
    analyzer = Analysis(audio_buffer, FakeObservationStore(), session_id=1, model=FakeVadModel([]), birdnet=cast(Birdnet, FakeBirdnet()))

    assert analyzer._human_speech_ratio(np.zeros(128, dtype=np.float32), 16000) == 0


def test_noise_analysis_waits_when_audio_buffer_is_not_full(tmp_path):
    audio_buffer = AudioRingBuffer(sample_rate=16000, duration_seconds=1)
    store = FakeObservationStore()
    birdnet = FakeBirdnet([{"common_name": "Northern Cardinal"}])
    analyzer = Analysis(
        audio_buffer,
        store,
        session_id=7,
        model=FakeVadModel([]),
        birdnet=cast(Birdnet, birdnet),
    )

    asyncio.run(analyzer.noise_analysis())

    assert analyzer.detections == []
    assert birdnet.calls == []
    assert store.calls == []


def test_noise_analysis_records_a_window_even_when_human_speech_is_high(monkeypatch):
    monkeypatch.setattr("record.analysis.torch.from_numpy", lambda samples: FakeTensor(samples))
    samples = np.zeros(16000, dtype=np.float32)
    audio_buffer = AudioRingBuffer(sample_rate=16000, duration_seconds=1)
    audio_buffer.write(samples)
    store = FakeObservationStore()
    birdnet = FakeBirdnet([{"common_name": "Northern Cardinal", "confidence": 0.92}])
    analyzer = Analysis(
        audio_buffer,
        store,
        session_id=11,
        model=FakeVadModel([0.9] * 31),
        birdnet=cast(Birdnet, birdnet),
    )

    asyncio.run(analyzer.noise_analysis())

    assert analyzer.detections == []
    assert birdnet.calls == []
    assert len(store.calls) == 1
    recorded = store.calls[0]
    assert recorded["session_id"] == 11
    assert recorded["sequence_number"] == 1
    assert recorded["analysis_state"] == "human_speech"
    assert recorded["birds"] == []
    assert recorded["human_speech_ratio"] == 1


def test_noise_analysis_writes_birds_when_human_speech_ratio_is_low(monkeypatch):
    monkeypatch.setattr("record.analysis.torch.from_numpy", lambda samples: FakeTensor(samples))
    samples = np.zeros(16000, dtype=np.float32)
    audio_buffer = AudioRingBuffer(sample_rate=16000, duration_seconds=1)
    audio_buffer.write(samples)
    store = FakeObservationStore()
    birdnet = FakeBirdnet([{"common_name": "Northern Cardinal", "confidence": 0.92}])
    analyzer = Analysis(
        audio_buffer,
        store,
        session_id=13,
        model=FakeVadModel([0.1] * 31),
        birdnet=cast(Birdnet, birdnet),
    )

    asyncio.run(analyzer.noise_analysis())

    assert len(analyzer.detections) == 1
    assert analyzer.detections[0]["common_name"] == "Northern Cardinal"
    assert "timestamp" in analyzer.detections[0]
    assert len(birdnet.calls) == 1
    analyzed_audio, analyzed_sample_rate = birdnet.calls[0]
    np.testing.assert_array_equal(analyzed_audio, samples)
    assert analyzed_sample_rate == 16000

    assert len(store.calls) == 1
    recorded = store.calls[0]
    assert recorded["session_id"] == 13
    assert recorded["sequence_number"] == 1
    assert recorded["analysis_state"] == "birds"
    assert len(recorded["birds"]) == 1
    assert recorded["birds"][0]["common_name"] == "Northern Cardinal"
    assert recorded["birds"][0]["confidence"] == 0.92


def test_noise_analysis_uses_next_window_sequence(monkeypatch):
    monkeypatch.setattr("record.analysis.torch.from_numpy", lambda samples: FakeTensor(samples))
    samples = np.zeros(16000, dtype=np.float32)
    audio_buffer = AudioRingBuffer(sample_rate=16000, duration_seconds=1)
    audio_buffer.write(samples)
    store = FakeObservationStore()
    birdnet = FakeBirdnet([{"common_name": "Northern Cardinal"}])
    analyzer = Analysis(
        audio_buffer,
        store,
        session_id=17,
        model=FakeVadModel([0.1] * 62),
        birdnet=cast(Birdnet, birdnet),
    )

    asyncio.run(analyzer.noise_analysis())
    asyncio.run(analyzer.noise_analysis())

    assert [call["sequence_number"] for call in store.calls] == [1, 2]

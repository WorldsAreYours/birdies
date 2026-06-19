import numpy as np

from record.audio_ring_buffer import AudioRingBuffer


def test_read_latest_returns_none_until_buffer_is_full():
    buffer = AudioRingBuffer(sample_rate=4, duration_seconds=2)

    buffer.write(np.array([1, 2, 3], dtype=np.float32))

    assert buffer.read_latest() is None


def test_read_latest_returns_samples_in_chronological_order_after_wraparound():
    buffer = AudioRingBuffer(sample_rate=4, duration_seconds=2)

    buffer.write(np.array([1, 2, 3, 4, 5], dtype=np.float32))
    buffer.write(np.array([6, 7, 8, 9, 10], dtype=np.float32))

    latest = buffer.read_latest()
    assert latest is not None
    np.testing.assert_array_equal(
        latest,
        np.array([3, 4, 5, 6, 7, 8, 9, 10], dtype=np.float32),
    )
    assert buffer.getWritePos() == 2


def test_callback_writes_first_audio_channel():
    buffer = AudioRingBuffer(sample_rate=4, duration_seconds=1)
    input_data = np.array(
        [
            [0.1, 9.0],
            [0.2, 9.0],
            [0.3, 9.0],
            [0.4, 9.0],
        ],
        dtype=np.float32,
    )

    buffer(input_data, frames=4, time=None, status=None)

    latest = buffer.read_latest()
    assert latest is not None
    np.testing.assert_allclose(latest, np.array([0.1, 0.2, 0.3, 0.4], dtype=np.float32))

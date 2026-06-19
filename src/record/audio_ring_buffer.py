from threading import Lock

import numpy as np


class AudioRingBuffer:
    def __init__(self, sample_rate: int = 48000, duration_seconds: int = 3) -> None:
        self.sample_rate = sample_rate
        self.duration_seconds = duration_seconds
        self.capacity = self.sample_rate * self.duration_seconds
        self.buffer = np.zeros(self.capacity, dtype=np.float32)
        self.write_pos = 0
        self.total_written = 0
        self.lock = Lock()

    def __call__(self, indata, frames, time, status) -> None:
        """Accept sounddevice audio chunks as an InputStream callback."""
        self.write(indata[:, 0])

    def get_buffer(self) -> np.ndarray:
        return self.buffer

    def getBuffer(self) -> np.ndarray:
        return self.get_buffer()

    def get_capacity(self) -> int:
        return self.capacity

    def getCapacity(self) -> int:
        return self.get_capacity()

    def get_sample_rate(self) -> int:
        return self.sample_rate

    def getSampleRate(self) -> int:
        return self.get_sample_rate()

    def get_write_pos(self) -> int:
        return self.write_pos

    def getWritePos(self) -> int:
        return self.get_write_pos()

    def write(self, chunk: np.ndarray) -> None:
        with self.lock:
            n = len(chunk)
            tail_len = min(n, self.capacity - self.write_pos)

            tail = chunk[:tail_len]
            head = chunk[tail_len:]

            self.buffer[self.write_pos:self.write_pos + tail_len] = tail
            self.buffer[:len(head)] = head

            self.write_pos = (self.write_pos + n) % self.capacity
            self.total_written += n

    def read_latest(self) -> np.ndarray | None:
        with self.lock:
            if self.total_written < self.capacity:
                return None

            return np.concatenate(
                [
                    self.buffer[self.write_pos:],
                    self.buffer[:self.write_pos],
                ]
            )

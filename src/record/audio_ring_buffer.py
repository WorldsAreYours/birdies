from threading import Lock
import os
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
    
    """
    Callable audio buffer. Passed directly to sounddevice InputStream as callback.
    Sounddevice calls __call__(indata, frames, time, status) on each audio chunk.
    """
    def __call__(self, indata, frames, time, status):
        self.write(indata[:, 0])
    
    def getBuffer(self) -> np.ndarray:
        return self.buffer
    
    def getCapacity(self) -> int:
        return self.capacity

    def getSampleRate(self) -> int:
        return self.sample_rate

    def getWritePos(self) -> int:
        return self.write_pos

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
            buffer = self.buffer
            start = self.write_pos
            if self.total_written < self.capacity:
                return None

            return np.concatenate([
                buffer[start:],
                buffer[:start]
            ])

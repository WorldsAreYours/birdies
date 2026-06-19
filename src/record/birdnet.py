from birdnetlib import RecordingBuffer
from birdnetlib.analyzer import Analyzer


class Birdnet:
    def __init__(self):
        self.error = None
        self.analyzer = Analyzer()

    def analyze(self, buffer, rate):
        if self.analyzer is None:
            print(f'BirdNET unavailable: {self.error}')
            return []

        recording = RecordingBuffer(self.analyzer, buffer, rate)
        recording.analyze()
        print(f'detections: {recording.detections}')
        return recording.detections

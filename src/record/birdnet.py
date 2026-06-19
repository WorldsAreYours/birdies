from birdnetlib import RecordingBuffer
from birdnetlib.analyzer import Analyzer
class Birdnet:
    def __init__(self):
        self.analyzer = None
        self.recording_buffer = None
        self.available = False
        self.error = None
        self.analyzer = Analyzer()

    def analyze(self, buffer, rate):
        recording_buffer = RecordingBuffer
        analyzer = self.analyzer

        if recording_buffer is None or analyzer is None:
            print(f'BirdNET unavailable: {self.error}')
            return []

        recording = recording_buffer(analyzer, buffer, rate)
        recording.analyze()
        print(f'detections: {recording.detections}')
        return recording.detections

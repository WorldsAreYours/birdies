class Birdnet:
    def __init__(self):
        self.analyzer = None
        self.recording_buffer = None
        self.available = False
        self.error = None

        try:
            from birdnetlib import RecordingBuffer
            from birdnetlib.analyzer import Analyzer
        except ModuleNotFoundError as exc:
            self.error = exc
            return

        self.analyzer = Analyzer()
        self.recording_buffer = RecordingBuffer
        self.available = True

    def analyze(self, buffer, rate):
        if not self.available:
            print(f'BirdNET unavailable: {self.error}')
            return []

        recording = self.recording_buffer(self.analyzer, buffer, rate)
        recording.analyze()
        print(f'detections: {recording.detections}')
        return recording.detections

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
        recording_buffer = self.recording_buffer
        analyzer = self.analyzer

        if not self.available or recording_buffer is None or analyzer is None:
            print(f'BirdNET unavailable: {self.error}')
            return []

        recording = recording_buffer(analyzer, buffer, rate)
        recording.analyze()
        print(f'detections: {recording.detections}')
        return recording.detections

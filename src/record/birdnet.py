from birdnetlib import RecordingBuffer
from birdnetlib.analyzer import Analyzer
from datetime import datetime

class Birdnet:
    def __init__(self):
        self.analyzer = Analyzer()
        self.rec = RecordingBuffer

    def analyze(self, buffer, rate):
        self.rec = RecordingBuffer(self.analyzer, buffer, rate)
        self.rec.analyze()
        print(f'detections: {self.rec.detections}')
    

        

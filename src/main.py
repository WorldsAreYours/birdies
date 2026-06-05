import io
import os
from dotenv import load_dotenv
import sounddevice as sd
import sys; print(sys.path)
from sounddevice import RawInputStream
from record.recorder import Recorder
from record.audiobuffer import AudioBuffer
from record.detection import Detection

load_dotenv()

buffer = AudioBuffer()

recorder = Recorder(48000, 10, 'float32', blocksize=512*3, callback=buffer)
print(type(recorder.stream))

if __name__ == "__main__":
    print('ok')
    with recorder.stream:
        sd.sleep(10000)
    birds = [Detection(bird) for bird  in buffer.detections]
    for bird in birds:
        cur = bird.getBird()
        print(f"common name for this birdie: {cur['common_name']}")


    
    # print(f'There were these birds:\n{buffer.detections}')
    # for detection in buffer.detections:
    #     print(detection.bird)


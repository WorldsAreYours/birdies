import io
import os
from dotenv import load_dotenv
import sounddevice as sd
from sounddevice import RawInputStream
from record.recorder import Recorder
from record.audiobuffer import AudioBuffer
from record.detection import Detection

load_dotenv()

path = os.path.expanduser('~/.birdie')
buffer = AudioBuffer(path)

recorder = Recorder(48000, 10, 'float32', blocksize=512*3, callback=buffer)

if __name__ == "__main__":

    os.makedirs(path, exist_ok=True)
    
    with recorder.stream:
        sd.sleep(6000)
    birds = [Detection(bird) for bird  in buffer.detections]
    for bird in birds:
        cur = bird.getBird()
        # print(f"common name for this birdie: {cur['common_name']}")


    
    # print(f'There were these birds:\n{buffer.detections}')
    # for detection in buffer.detections:
    #     print(detection.bird)


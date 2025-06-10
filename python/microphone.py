import speech_recognition as sr
import requests
import sounddevice as sd
import numpy as np
import io
import scipy.io.wavfile as wav

recognizer = sr.Recognizer()
wake_word = "hello"

SAMPLE_RATE = 16000

def record_audio(duration):
    print(f"🎤 Recording for {duration} seconds...")
    audio = sd.rec(int(SAMPLE_RATE * duration), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
    sd.wait()
    return np.squeeze(audio)

def audio_data_from_numpy(np_audio):
    byte_io = io.BytesIO()
    wav.write(byte_io, SAMPLE_RATE, np_audio)
    byte_io.seek(0)
    return sr.AudioFile(byte_io)

def listen(duration=5):
    np_audio = record_audio(duration)
    with audio_data_from_numpy(np_audio) as source:
        audio = recognizer.record(source)
    try:
        return recognizer.recognize_google(audio).lower()
    except sr.UnknownValueError:
        return ""
    except Exception as e:
        print("Recognition Error:", e)
        return ""

while True:
    print("Say the wake word...")
    text = listen(duration=3)  # listen for 5 seconds to detect wake word
    print("Heard:", text)

    if wake_word in text:
        print("Wake word detected. You have 20 seconds to speak.")
        question = listen(duration=20)  # listen for 20 seconds after wake word
        print("You asked:", question)

        # Send to chatbot (n8n)
        try:
            res = requests.post("https://shardcarecubs.app.n8n.cloud/webhook/a8df4b22-922c-4f6d-9c34-2d25d8ff37a9", json={"message": question})
            print("🤖 Bot:", res.json().get("reply", "No reply"))
        except Exception as e:
            print("❌ Error talking to chatbot:", e)

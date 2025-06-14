# mic.py
import speech_recognition as sr
import requests
import sounddevice as sd
import numpy as np
import io
import scipy.io.wavfile as wav
import socket

recognizer = sr.Recognizer()
wake_word = "hello"
SAMPLE_RATE = 16000

WEBHOOK_URL = "https://shardcarecubs.app.n8n.cloud/webhook/a8df4b22-922c-4f6d-9c34-2d25d8ff37a9"

def send_to_node(message):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect(('localhost', 9999))
        sock.send(message.encode('utf-8'))
        sock.close()
    except Exception as e:
        print("Socket error:", e)

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
    text = listen(duration=3)
    print("Heard:", text)

    if wake_word in text:
        print("Wake word detected. You have 10 seconds to speak.")
        send_to_node("mic-start")

        question = listen(duration=10)
        print("You asked:", question)

        if question:
            send_to_node(f"user:{question}")

        try:
            res = requests.post(WEBHOOK_URL, json={"message": question})
            reply = res.json().get("reply", "No reply")
            print("🤖 Bot:", reply)
            send_to_node(f"bot:{reply}")
        except Exception as e:
            print("❌ Error talking to chatbot:", e)
            send_to_node("bot:Error talking to chatbot.")

        send_to_node("mic-end")

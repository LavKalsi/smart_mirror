from gpiozero import InputDevice
from datetime import datetime
import time

# Connect OUT pin of IR sensor to GPIO17
ir_sensor = InputDevice(17)

try:
    while True:
        if not ir_sensor.is_active:  # Reverse condition: when object is detected (signal LOW)
            current_time = datetime.now().strftime("%H:%M:%S")
            print(f"Object detected at: {current_time}")
            time.sleep(1)
        else:
            time.sleep(0.1)
except KeyboardInterrupt:
    print("Stopped by user.")

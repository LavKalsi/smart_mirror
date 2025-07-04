from gpiozero import DistanceSensor
import socket
import time

# Set up ultrasonic sensor (GPIO24 = Echo, GPIO23 = Trigger)
sensor = DistanceSensor(echo=24, trigger=23)

last_state = None
hide_timer_start = None  # To track when the distance first exceeded 60 cm

def send_state(state):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect(('localhost', 9999))
        sock.send(state.encode('utf-8'))
        sock.close()
    except Exception as e:
        print("Socket error:", e)

print("Monitoring distance... Press Ctrl+C to stop.")

try:
    while True:
        distance_cm = sensor.distance * 100  # Convert meters to cm
        print(f"Distance: {distance_cm:.1f} cm")

        if distance_cm > 60:
            # Start the hide timer if not already started
            if hide_timer_start is None:
                hide_timer_start = time.time()
                print("No one detected, starting 30-second countdown to hide...")

            # If 30 seconds have passed and still no one detected, send "hide"
            elif time.time() - hide_timer_start >= 30 and last_state != "hide":
                send_state("hide")
                last_state = "hide"
                print("Sent: hide")
        else:
            # Someone is nearby, reset the hide timer and send "show" if not already shown
            if last_state != "show":
                send_state("show")
                last_state = "show"
                print("Sent: show")
            hide_timer_start = None  # Reset the hide timer

        time.sleep(1.0)

except KeyboardInterrupt:
    print("Stopped.")

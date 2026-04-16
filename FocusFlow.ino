#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;


const int irSensorPin = 4;   // TCRT5000 

// Blink detection
int lastIRState = HIGH;
int blinkCount = 0;

// Motion Sensitivity
const int motionThreshold = 5000;

void setup() {

  Serial.begin(115200);

  // IR sensor
  pinMode(irSensorPin, INPUT);

  // Gyro setup
  Wire.begin(8, 9); // SDA, SCL
  mpu.initialize();

  Serial.println("System Starting...");

  if (mpu.testConnection()) {
    Serial.println("MPU6050 Connected");
  } else {
    Serial.println("MPU6050 Failed");
  }
}

void loop() {

  // Blink Detection
  int irState = digitalRead(irSensorPin);

  if (irState == LOW && lastIRState == HIGH) {
    blinkCount++;
    Serial.print("Blink Detected! Total: ");
    Serial.println(blinkCount);
  }

  lastIRState = irState;


  // Gyro motion detection
  int16_t gx, gy, gz;
  mpu.getRotation(&gx, &gy, &gz);

  int motionValue = abs(gx) + abs(gy) + abs(gz);

  if (motionValue > motionThreshold) {
    Serial.println("Motion Detected!");
  }

  delay(30);
}
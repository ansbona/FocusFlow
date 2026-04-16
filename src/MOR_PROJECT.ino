#include <WiFi.h>
#include <Wire.h>
#include <Firebase_ESP_Client.h>
#include <MPU6050.h>

// WiFi credentials
#define WIFI_SSID ""
#define WIFI_PASSWORD ""

// Firebase credentials
#define API_KEY "AIzaSyCRosSeYnlmjNJ_SHIBe2SrgY5Z9jtZD0g"
#define DATABASE_URL "https://focusflow-esp32-default-rtdb.asia-southeast1.firebasedatabase.app"

// Firebase objects
FirebaseData fbdo;
FirebaseConfig config;

// MPU6050
MPU6050 mpu;

// IR sensor pin
const int irSensorPin = 4;

// Blink detection
bool irLastState = true;
bool waitingForBlinkEnd = false;
unsigned long blinkStartTime = 0;
const unsigned long MIN_BLINK_TIME = 40;
int blinkCount = 0;

// Motion
bool isMoving = false;
unsigned long lastMotionTime = 0;
unsigned long motionStartTime = 0;                  // NEW
const unsigned long MOTION_COOLDOWN = 800;          // CHANGED (was 5000)
const unsigned long MIN_MOTION_DURATION = 500;      // NEW
int headMovementCount = 0;
int16_t prevGx = 0, prevGy = 0, prevGz = 0;        // NEW

// BPM - 30 second window
int blinkBuffer[30] = {0};
unsigned long lastResetTime = 0;
const unsigned long RESET_INTERVAL = 5000;
int currentBPM = 0;

// Firebase timing
unsigned long lastFirebase = 0;
const unsigned long FB_INTERVAL = 2000;
int firebaseErrors = 0;

void setup() {
  Serial.begin(115200);
  pinMode(irSensorPin, INPUT_PULLUP);
  Serial.println("Blink and Head Movement Detector");

  // MPU6050 setup
  Wire.begin(8, 9);
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("MPU6050 Connected");
  } else {
    Serial.println("MPU6050 Failed - check wiring");
  }

  connectWiFi();

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = API_KEY;
  config.timeout.serverResponse = 5000;
  config.timeout.socketConnection = 5000;
  Firebase.begin(&config, nullptr);
  Firebase.reconnectWiFi(true);

  Serial.println("Ready");
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    Serial.print(".");
    delay(200);
  }
  Serial.println(" " + WiFi.localIP().toString());
}

void loop() {
  //
  // BLINK DETECTION
  //
  bool irNow = digitalRead(irSensorPin);

  if (!waitingForBlinkEnd && irNow == LOW && irLastState == HIGH) {
    blinkStartTime = millis();
    waitingForBlinkEnd = true;
  }
  if (waitingForBlinkEnd && irNow == HIGH && irLastState == LOW) {
    if (millis() - blinkStartTime >= MIN_BLINK_TIME) {
      blinkCount++;
      Serial.println(blinkCount);
    }
    waitingForBlinkEnd = false;
  }
  irLastState = irNow;

  //
  // BPM CALCULATION
  //
  if (millis() - lastResetTime >= RESET_INTERVAL) {
    lastResetTime = millis();
    for (int i = 29; i > 0; i--) {
      blinkBuffer[i] = blinkBuffer[i - 1];
    }
    blinkBuffer[0] = blinkCount;
    int totalBlinks = 0;
    for (int i = 0; i < 30; i++) {
      totalBlinks += blinkBuffer[i];
    }
    currentBPM = totalBlinks;
    blinkCount = 0;
    Serial.print("BPM: ");
    Serial.println(currentBPM);
  }

  //
  // HEAD MOVEMENT (MPU6050) — updated logic
  //
  int16_t gx, gy, gz;
  mpu.getRotation(&gx, &gy, &gz);

  int delta = abs(gx - prevGx) + abs(gy - prevGy) + abs(gz - prevGz);
  prevGx = gx; prevGy = gy; prevGz = gz;

  if (delta > 1000) {
    lastMotionTime = millis();
    if (!isMoving) {
      isMoving = true;
      motionStartTime = millis();
    }
  } else if (isMoving && millis() - lastMotionTime > MOTION_COOLDOWN) {
    if (millis() - motionStartTime >= MIN_MOTION_DURATION) {
      headMovementCount++;
      Serial.print("Head movement: ");
      Serial.println(headMovementCount);
    }
    isMoving = false;
  }

  //
  // FIREBASE SEND (every 2s)
  //
  if (millis() - lastFirebase >= FB_INTERVAL && WiFi.status() == WL_CONNECTED) {
    lastFirebase = millis();

    if (Firebase.RTDB.setInt(&fbdo, "/blinkRate", currentBPM)) {
      Serial.println("BlinkRate OK");
      firebaseErrors = 0;
    } else {
      Serial.print("BlinkRate ERR: ");
      Serial.println(firebaseErrors++);
    }

    if (Firebase.RTDB.setInt(&fbdo, "/headMovement", headMovementCount)) {
      Serial.println("HeadMovement OK");
    } else {
      Serial.print("HeadMovement ERR: ");
      Serial.println(fbdo.errorReason());
    }
  }
}
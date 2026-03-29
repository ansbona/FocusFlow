#include <WiFi.h>
#include <Wire.h>
#include <Firebase_ESP_Client.h>
#include <MPU6050.h>

// WiFi credentials
#define WIFI_SSID "GlobeAtHome_FC865_2.4"
#define WIFI_PASSWORD "EF7t6xgU"

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
const unsigned long MOTION_COOLDOWN = 1000; // 1 second cooldown
int headMovementCount = 0;

// BPM - 30 second window
int blinkBuffer[30] = {0};
unsigned long lastResetTime = 0;
const unsigned long RESET_INTERVAL = 5000;
int currentBPM = 0;

// Motion threshold
const int motionThreshold = 5000;

// Firebase timing
unsigned long lastFirebase = 0;
const unsigned long FB_INTERVAL = 2000;
int firebaseErrors = 0;

void setup() {
  Serial.begin(115200);
  pinMode(irSensorPin, INPUT_PULLUP);
  Serial.println("Blink + Head Movement Detector");

  // MPU6050 setup
  Wire.begin(8, 9); // SDA=21, SCL=22 by default on ESP32
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
  // ======================
  // BLINK DETECTION
  // ======================
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

  // ======================
  // BPM CALCULATION (5s window)
  // ======================
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

  // ======================
  // HEAD MOVEMENT (MPU6050)
  // ======================
  int16_t gx, gy, gz;
  mpu.getRotation(&gx, &gy, &gz);
  int rawMotion = abs(gx) + abs(gy) + abs(gz);

  if (rawMotion > 1000) {
    if (!isMoving) {
      isMoving = true;
      headMovementCount++;
    }
    lastMotionTime = millis();
  } else {
    if (isMoving && millis() - lastMotionTime > MOTION_COOLDOWN) {
      isMoving = false;
    }
  }

  // ======================
  // FIREBASE SEND (every 2s)
  // ======================
  if (millis() - lastFirebase >= FB_INTERVAL && WiFi.status() == WL_CONNECTED) {
    lastFirebase = millis();

    // Send blink rate
    if (Firebase.RTDB.setInt(&fbdo, "/blinkRate", currentBPM)) {
      Serial.println("BlinkRate OK");
      firebaseErrors = 0;
    } else {
      Serial.print("BlinkRate ERR: ");
      Serial.println(firebaseErrors++);
    }

    // Send head movement
    if (Firebase.RTDB.setInt(&fbdo, "/headMovement", headMovementCount)) {
      Serial.println("HeadMovement OK");
    } else {
      Serial.print("HeadMovement ERR: ");
      Serial.println(fbdo.errorReason());
    }
  }
}
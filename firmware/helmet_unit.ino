/*
 * ============================================================
 * SMART HELMET MONITORING SYSTEM
 * Helmet Unit — Arduino Nano Firmware
 * ============================================================
 * 
 * PURPOSE:
 * - Read alcohol level from MQ-3 sensor
 * - Detect if helmet is worn (IR sensor)
 * - Read battery level
 * - Send data to bike ESP32 via Bluetooth (HC-05)
 * 
 * PACKET FORMAT:
 *   "HELMET_ID,WORN,ALCOHOL_LEVEL,BATTERY_LEVEL"
 *   Example: "H001,1,150,85"
 * 
 * HARDWARE:
 * - Arduino Nano
 * - MQ-3 Alcohol Sensor (A0)
 * - IR Sensor (D2)
 * - HC-05 Bluetooth (D10 RX, D11 TX)
 * - Status LED (D13, built-in)
 * - Battery monitor (A1, optional)
 * 
 * ============================================================
 */

#include <SoftwareSerial.h>

// ============================================================
// CONFIGURATION
// ============================================================

// Device identifier — must match backend helmet code
const char* HELMET_ID = "H001";

// Send interval
const unsigned long SEND_INTERVAL_MS = 500;

// MQ-3 warm-up time (ms) — sensor needs 60s to stabilize
const unsigned long MQ3_WARMUP_MS = 60000;

// Alcohol detection threshold (raw ADC value 0-1023)
// Lower values = more alcohol detected
// Adjust based on your sensor calibration
const int ALCOHOL_THRESHOLD = 300;

// Battery thresholds
const float BATTERY_LOW_VOLTAGE = 3.4;   // LiPo low voltage
const float BATTERY_FULL_VOLTAGE = 4.2;  // LiPo full voltage

// ============================================================
// PIN DEFINITIONS
// ============================================================

#define MQ3_PIN          A0    // MQ-3 analog output
#define IR_PIN           2     // IR sensor digital output
#define BT_RX_PIN        10    // HC-05 TX → Arduino D10 (RX)
#define BT_TX_PIN        11    // HC-05 RX ← Arduino D11 (TX)
#define STATUS_LED       13    // Built-in LED
#define BATTERY_PIN      A1    // Battery voltage divider

// ============================================================
// BLUETOOTH SERIAL
// ============================================================

SoftwareSerial bluetooth(BT_RX_PIN, BT_TX_PIN);

// ============================================================
// GLOBAL STATE
// ============================================================

unsigned long lastSendTime = 0;
unsigned long bootTime = 0;

// MQ-3 baseline (auto-calibrated during warm-up)
int mq3Baseline = 0;
int mq3Samples[50];
int mq3SampleIndex = 0;

// Sensor readings
int alcoholLevel = 0;
bool helmetWorn = false;
int batteryPercent = 100;
float batteryVoltage = 4.2;

// ============================================================
// SETUP
// ============================================================

void setup() {
  // Serial for debugging (to PC)
  Serial.begin(9600);

  // Bluetooth serial for HC-05
  bluetooth.begin(9600);

  // Pin setup
  pinMode(MQ3_PIN, INPUT);
  pinMode(IR_PIN, INPUT);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(BATTERY_PIN, INPUT);

  Serial.println();
  Serial.println("===========================================");
  Serial.println("  SMART HELMET — HELMET UNIT (Arduino Nano)");
  Serial.println("  Firmware v1.0.0");
  Serial.println("===========================================");
  Serial.print("Helmet ID: ");
  Serial.println(HELMET_ID);
  Serial.println();

  // Warm-up phase with LED blink
  Serial.println("[INIT] MQ-3 warm-up (60 seconds)...");
  warmUpMQ3();

  // Auto-calibrate MQ-3 baseline
  Serial.println("[INIT] Calibrating MQ-3 baseline...");
  calibrateMQ3();

  Serial.println("[INIT] Setup complete");
  Serial.println("===========================================");
  Serial.println();
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop() {
  // 1. Read all sensors
  readIRSensor();
  readMQ3Sensor();
  readBatteryLevel();

  // 2. Update status LED
  updateStatusLED();

  // 3. Send data every 500ms
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    sendDataPacket();
  }

  // 4. Print debug info every 2 seconds
  static unsigned long lastDebug = 0;
  if (millis() - lastDebug > 2000) {
    lastDebug = millis();
    printDebugInfo();
  }

  delay(10);
}

// ============================================================
// WARM-UP
// ============================================================

void warmUpMQ3() {
  unsigned long startTime = millis();
  unsigned long lastBlink = 0;
  bool ledState = false;

  while (millis() - startTime < MQ3_WARMUP_MS) {
    // Blink LED every 500ms during warm-up
    if (millis() - lastBlink > 500) {
      lastBlink = millis();
      ledState = !ledState;
      digitalWrite(STATUS_LED, ledState);

      // Print progress every 10 seconds
      unsigned long elapsed = (millis() - startTime) / 1000;
      if (elapsed % 10 == 0) {
        Serial.print("[WARMUP] ");
        Serial.print(elapsed);
        Serial.println("s / 60s");
      }
    }
    delay(50);
  }

  digitalWrite(STATUS_LED, LOW);
  Serial.println("[WARMUP] Complete");
}

// ============================================================
// MQ-3 CALIBRATION
// ============================================================

void calibrateMQ3() {
  long sum = 0;
  const int samples = 50;

  for (int i = 0; i < samples; i++) {
    sum += analogRead(MQ3_PIN);
    delay(20);
  }

  mq3Baseline = sum / samples;

  Serial.print("[CALIBRATION] MQ-3 baseline (clean air): ");
  Serial.println(mq3Baseline);
}

// ============================================================
// SENSOR READING
// ============================================================

void readIRSensor() {
  // IR sensor: LOW = object detected (helmet worn)
  //            HIGH = no object (helmet not worn)
  int reading = digitalRead(IR_PIN);
  helmetWorn = (reading == LOW);
}

void readMQ3Sensor() {
  int reading = analogRead(MQ3_PIN);

  // Store in circular buffer for smoothing
  mq3Samples[mq3SampleIndex] = reading;
  mq3SampleIndex = (mq3SampleIndex + 1) % 50;

  // Average the samples
  long sum = 0;
  for (int i = 0; i < 50; i++) {
    sum += mq3Samples[i];
  }
  int average = sum / 50;

  // Alcohol level = difference from baseline
  // Higher difference = more alcohol
  int diff = average - mq3Baseline;
  if (diff < 0) diff = 0;

  // Convert to 0-1023 scale (higher = more alcohol)
  alcoholLevel = constrain(diff, 0, 1023);
}

void readBatteryLevel() {
  // Read battery voltage via voltage divider
  // Assumes 2:1 divider (e.g., 100k + 100k)
  int raw = analogRead(BATTERY_PIN);

  // Convert ADC to voltage (Arduino Nano: 5V reference, 10-bit)
  // Voltage at pin = (raw / 1023.0) * 5.0
  // Actual battery voltage = pin voltage * 2 (divider)
  float pinVoltage = (raw / 1023.0) * 5.0;
  batteryVoltage = pinVoltage * 2.0;

  // Convert to percentage
  float percent = ((batteryVoltage - BATTERY_LOW_VOLTAGE) /
                   (BATTERY_FULL_VOLTAGE - BATTERY_LOW_VOLTAGE)) * 100.0;
  batteryPercent = constrain((int)percent, 0, 100);
}

// ============================================================
// STATUS LED
// ============================================================

void updateStatusLED() {
  // LED meanings:
  // - Solid ON: helmet worn + sober
  // - Slow blink (1Hz): helmet worn + drunk
  // - Fast blink (5Hz): helmet not worn
  // - Off: no power

  static unsigned long lastBlink = 0;
  static bool ledState = false;

  if (!helmetWorn) {
    // Fast blink
    if (millis() - lastBlink > 100) {
      lastBlink = millis();
      ledState = !ledState;
      digitalWrite(STATUS_LED, ledState);
    }
  } else if (alcoholLevel >= ALCOHOL_THRESHOLD) {
    // Slow blink
    if (millis() - lastBlink > 500) {
      lastBlink = millis();
      ledState = !ledState;
      digitalWrite(STATUS_LED, ledState);
    }
  } else {
    // Solid ON
    digitalWrite(STATUS_LED, HIGH);
  }
}

// ============================================================
// SEND DATA PACKET
// ============================================================

void sendDataPacket() {
  // Build packet: "H001,1,150,85"
  String packet = String(HELMET_ID) + "," +
                  String(helmetWorn ? 1 : 0) + "," +
                  String(alcoholLevel) + "," +
                  String(batteryPercent) + "\n";

  // Send via Bluetooth
  bluetooth.print(packet);

  // Also log to Serial for debugging
  Serial.print("[SEND] ");
  Serial.print(packet);
}

// ============================================================
// DEBUG INFO
// ============================================================

void printDebugInfo() {
  Serial.println("--- Status ---");
  Serial.print("Helmet worn: ");
  Serial.println(helmetWorn ? "YES" : "NO");
  Serial.print("Alcohol level: ");
  Serial.print(alcoholLevel);
  Serial.print(" (threshold: ");
  Serial.print(ALCOHOL_THRESHOLD);
  Serial.println(")");
  Serial.print("Battery: ");
  Serial.print(batteryPercent);
  Serial.print("% (");
  Serial.print(batteryVoltage, 2);
  Serial.println("V)");
  Serial.print("MQ-3 baseline: ");
  Serial.println(mq3Baseline);
  Serial.print("Uptime: ");
  Serial.print(millis() / 1000);
  Serial.println("s");
  Serial.println();
}
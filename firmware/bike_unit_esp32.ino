/*
 * ============================================================
 * SMART HELMET MONITORING SYSTEM
 * Bike Unit — ESP32 Firmware
 * ============================================================
 * 
 * PURPOSE:
 * - Receive sensor data from helmet via Bluetooth
 * - Send data to cloud backend via WiFi (HTTP POST)
 * - Control relay for engine start prevention
 * 
 * LOGIC (AND Gate):
 * Engine Allowed = (ID Match) AND (Helmet Worn) AND (No Alcohol)
 * 
 * HARDWARE:
 * - ESP32 Dev Module
 * - HC-05 Bluetooth module (RX2/TX2)
 * - 5V Relay module (GPIO 4)
 * - Status LED (GPIO 2, built-in)
 * 
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================================
// CONFIGURATION — CHANGE THESE VALUES
// ============================================================

// WiFi Credentials
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend Server
const char* SERVER_URL    = "http://192.168.1.100:5000/api/sensor/data";

// Device API Key (from seed.js)
const char* DEVICE_API_KEY = "c420c72618426f75f2fa256eb6abcf7719be1219e0004c5926dc62da93980ed4";

// Device Identifiers
const char* BIKE_CODE     = "B001";
const char* DEFAULT_HELMET = "H001";

// ============================================================
// PIN DEFINITIONS
// ============================================================

#define RELAY_PIN       4       // Relay control (starter circuit)
#define STATUS_LED      2       // Built-in LED
#define BT_RX_PIN       16      // HC-05 TX → ESP32 RX2
#define BT_TX_PIN       17      // HC-05 RX ← ESP32 TX2

// ============================================================
// TIMING CONSTANTS
// ============================================================

const unsigned long SEND_INTERVAL_MS       = 500;   // Send every 500ms
const unsigned long WIFI_RETRY_MS          = 5000;  // Retry WiFi every 5s
const unsigned long HTTP_TIMEOUT_MS        = 3000;  // HTTP timeout
const unsigned long SERIAL_BAUD            = 115200;
const unsigned long BT_BAUD                = 9600;  // HC-05 default

// ============================================================
// GLOBAL STATE
// ============================================================

unsigned long lastSendTime = 0;
unsigned long lastWifiRetry = 0;
bool wifiConnected = false;
bool relayState = false;

// Latest sensor data from helmet
struct HelmetData {
  String helmetCode;
  bool worn;
  int alcoholLevel;
  int batteryLevel;
  bool valid;
  unsigned long lastUpdate;
};

HelmetData helmetData = { "", false, 0, 0, false, 0 };

// ============================================================
// SETUP
// ============================================================

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(1000);

  Serial.println();
  Serial.println("===========================================");
  Serial.println("  SMART HELMET — BIKE UNIT (ESP32)");
  Serial.println("  Firmware v1.0.0");
  Serial.println("===========================================");

  // Initialize relay pin
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);  // Default OFF — safe by design
  Serial.println("[INIT] Relay: OFF (engine blocked by default)");

  // Initialize status LED
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  // Initialize Bluetooth serial (HC-05 on Serial2)
  Serial2.begin(BT_BAUD, SERIAL_8N1, BT_RX_PIN, BT_TX_PIN);
  Serial.println("[INIT] Bluetooth Serial2 ready (RX=16, TX=17)");

  // Connect to WiFi
  connectToWiFi();

  Serial.println("[INIT] Setup complete");
  Serial.println("===========================================");
  Serial.println();
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop() {
  // 1. Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiRetry > WIFI_RETRY_MS) {
      lastWifiRetry = millis();
      connectToWiFi();
    }
    // Blink LED fast when disconnected
    digitalWrite(STATUS_LED, (millis() / 200) % 2);
  } else {
    // Solid LED when connected
    digitalWrite(STATUS_LED, HIGH);
  }

  // 2. Read Bluetooth data from helmet
  readBluetoothData();

  // 3. Send data to cloud every 500ms
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    if (WiFi.status() == WL_CONNECTED && helmetData.valid) {
      sendToCloud();
    }
  }

  // 4. Fail-safe: if helmet data is stale (> 3 seconds), block engine
  if (helmetData.valid && (millis() - helmetData.lastUpdate > 3000)) {
    Serial.println("[WARN] Helmet data stale — blocking engine");
    setRelay(false);
    helmetData.valid = false;
  }

  delay(10);
}

// ============================================================
// WIFI CONNECTION
// ============================================================

void connectToWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("[WiFi] Connection FAILED — will retry");
  }
}

// ============================================================
// BLUETOOTH DATA READING
// ============================================================

void readBluetoothData() {
  if (!Serial2.available()) return;

  // Read line from Bluetooth
  String packet = Serial2.readStringUntil('\n');
  packet.trim();

  if (packet.length() == 0) return;

  Serial.print("[BT] Received: ");
  Serial.println(packet);

  // Parse packet: "H001,1,0,85"
  // Format: HELMET_ID,WORN,ALCOHOL_LEVEL,BATTERY_LEVEL
  int firstComma = packet.indexOf(',');
  int secondComma = packet.indexOf(',', firstComma + 1);
  int thirdComma = packet.indexOf(',', secondComma + 1);

  if (firstComma == -1 || secondComma == -1) {
    Serial.println("[BT] Invalid packet format");
    return;
  }

  helmetData.helmetCode = packet.substring(0, firstComma);
  helmetData.worn = packet.substring(firstComma + 1, secondComma).toInt() == 1;
  helmetData.alcoholLevel = packet.substring(secondComma + 1, 
                              thirdComma == -1 ? packet.length() : thirdComma).toInt();
  helmetData.batteryLevel = thirdComma == -1 ? 0 : 
                             packet.substring(thirdComma + 1).toInt();
  helmetData.valid = true;
  helmetData.lastUpdate = millis();

  Serial.printf("[BT] Parsed: helmet=%s, worn=%d, alcohol=%d, battery=%d\n",
                helmetData.helmetCode.c_str(),
                helmetData.worn,
                helmetData.alcoholLevel,
                helmetData.batteryLevel);
}

// ============================================================
// SEND DATA TO CLOUD
// ============================================================

void sendToCloud() {
  HTTPClient http;
  http.begin(SERVER_URL);
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["helmetCode"]   = helmetData.helmetCode;
  doc["bikeCode"]     = BIKE_CODE;
  doc["worn"]         = helmetData.worn;
  doc["alcoholLevel"] = helmetData.alcoholLevel;
  doc["batteryLevel"] = helmetData.batteryLevel;

  String payload;
  serializeJson(doc, payload);

  Serial.print("[HTTP] POST → ");
  Serial.println(payload);

  // Send POST request
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Response (%d): %s\n", httpCode, response.c_str());

    // Parse response
    StaticJsonDocument<512> responseDoc;
    DeserializationError err = deserializeJson(responseDoc, response);

    if (!err) {
      bool engineAllowed = responseDoc["data"]["engineAllowed"] | false;
      bool relayStateFromServer = responseDoc["data"]["relayState"] | false;

      // Control relay
      setRelay(engineAllowed);

      // Log violations
      if (responseDoc["data"]["violations"].is<JsonArray>()) {
        JsonArray violations = responseDoc["data"]["violations"];
        for (JsonVariant v : violations) {
          Serial.printf("[VIOLATION] %s\n", v.as<const char*>());
        }
      }
    } else {
      Serial.printf("[HTTP] JSON parse error: %s\n", err.c_str());
      setRelay(false);
    }
  } else {
    Serial.printf("[HTTP] Request failed: %s\n", http.errorToString(httpCode).c_str());
    setRelay(false);  // Fail-safe
  }

  http.end();
}

// ============================================================
// RELAY CONTROL
// ============================================================

void setRelay(bool state) {
  if (relayState != state) {
    relayState = state;
    digitalWrite(RELAY_PIN, state ? HIGH : LOW);
    Serial.printf("[RELAY] %s — engine %s\n", 
                  state ? "ON" : "OFF",
                  state ? "allowed to start" : "blocked");
  }
}
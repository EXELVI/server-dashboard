#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <TFT_eSPI.h>
#include <SPI.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>

#define RLOAD 10.0  // MQ-135 load resistance in kilo ohms
#define RZERO 76.63 // Average value (should be calibrated for each sensor)

// MARK: - WiFi Credentials
#include "secrets.h" // Include your WiFi and server credentials here

// Configurazione WiFi
const char *ssid = SECRET_SSID;
const char *password = SECRET_PASSWORD;

// Configurazione server (HTTPS)
const char *serverURL = SECRET_SERVER_URL;
const char *deviceId = "lilygo_sensor_001";

// MARK: - Sensor Instances
Adafruit_AHTX0 ath;
Adafruit_BMP280 bmp;

const int MQ135_PIN = 32; // pin for MQ-135 sensor, PUT A 1OK OHM RESISTOR BETWEEN SENSOR A0 AND THIS PIN, AND A 20K OHM RESISTOR BETWEEN THIS PIN AND GND

// MARK: - Display Instance
TFT_eSPI tft = TFT_eSPI();

// MARK: - Global Variables
float temperature = 0.0;
float humidity = 0.0;
float pressure = 0.0;
float airQuality = 0.0;

unsigned long lastSensorRead = 0;
unsigned long lastDataSend = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastWifiTry = 0;

const unsigned long SENSOR_INTERVAL = 2000;      // 2 seconds
const unsigned long SEND_INTERVAL = 30000;       // 30 seconds
const unsigned long DISPLAY_INTERVAL = 1000;     // 1 second
const unsigned long WIFI_RETRY_INTERVAL = 60000; // 60 seconds

bool wifiConnected = false;
int connectionAttempts = 0;

// MARK: - WebSocket Client
WebSocketsClient webSocket;

const char *WS_HOST = "192.168.1.6"; // your dashboard server IP address
const uint16_t WS_PORT = 3134; // match ws server port 
const char *WS_PATH = "/api/socket";

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
  switch (type)
  {
  case WStype_DISCONNECTED:
    Serial.println("WebSocket Disconnected!");
    break;
  case WStype_CONNECTED:
    Serial.println("WebSocket Connected!");
    break;
  case WStype_TEXT:
    Serial.printf("WebSocket Message: %s\n", payload);
    break;
  }
}
// MARK: - Display Status
void displayStatus(const char *message, uint16_t color, bool lineBreak = true)
{
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(color, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(10, tft.height() / 2 - 10);
  if (lineBreak)
  {
    tft.println(message);
  }
  else
  {
    tft.print(message);
  }
}

// MARK: - WiFi Connection
void connectToWiFi()
{
  Serial.print("Connecting to WiFi...");
  Serial.println(ssid);

  displayStatus("Connecting to WiFi...", TFT_YELLOW, false);

  WiFi.begin(ssid, password);
  connectionAttempts = 0;

  while (WiFi.status() != WL_CONNECTED && connectionAttempts < 20)
  {
    delay(500);
    Serial.print(".");
    tft.print(".");
    connectionAttempts++;
  }

  lastWifiTry = millis();

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("");
    Serial.println("WiFi connected.");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    displayStatus("WiFi Connected", TFT_GREEN);
    wifiConnected = true;
  }
  else
  {
    Serial.println("");
    Serial.println("Failed to connect to WiFi.");
    displayStatus("WiFi Failed!", TFT_RED);
    wifiConnected = false;
  }
}

void readSensors()
{
  sensors_event_t humidity_event, temp_event;
  ath.getEvent(&humidity_event, &temp_event);

  temperature = temp_event.temperature;
  humidity = humidity_event.relative_humidity;

  pressure = bmp.readPressure() / 100.0; // Convert to hPa

  int raw = analogRead(MQ135_PIN);
  float voltage = raw * (3.3 / 4095.0);

  if (voltage < 0.05 || voltage > 3.2)
  {
    Serial.println("MQ-135 voltage out of range!");
    airQuality = NAN;
  }

  float rs = ((3.3 - voltage) / voltage) * RLOAD;

  if (rs <= 0 || isnan(rs))
  {
    Serial.println("MQ-135 Rs invalid!");
    airQuality = NAN;
  }

  float ratio = rs / RZERO;
  float ppm = 116.6020682 * pow(ratio, -2.769034857);

  airQuality = ppm;

  Serial.printf("MQ-135 Raw: %d\n", raw);
  Serial.printf("MQ-135 Voltage: %.2f V\n", voltage);
  Serial.printf("MQ-135 Rs: %.2f kOhms\n", rs);
  Serial.printf("MQ-135 Ratio: %.2f\n", ratio);
  Serial.printf("MQ-135 PPM: %.2f\n", ppm);

  airQuality = ppm;

  Serial.printf("Temp: %.2f C, Humidity: %.2f %%, Pressure: %.2f hPa, Air Quality: %.2f PPM\n", temperature, humidity, pressure, airQuality);

  sendDataViaWebSocket();
}

// MARK: - Format Uptime
String formatUptime(unsigned long seconds)
{
  unsigned long hrs = seconds / 3600;
  unsigned long mins = (seconds % 3600) / 60;
  unsigned long secs = seconds % 60;

  char buffer[20];
  snprintf(buffer, sizeof(buffer), "%02lu:%02lu:%02lu", hrs, mins, secs);
  return String(buffer);
}

// MARK: - Update Display
void updateDisplay()
{
  tft.fillScreen(TFT_BLACK);

  // Header (Cyan)
  tft.setTextColor(TFT_CYAN, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(10, 10);
  tft.printf("Env Monitor");

  // Separator
  tft.drawLine(0, 35, tft.width(), 35, TFT_WHITE);

  // Temperature (Red)
  tft.setTextColor(TFT_RED, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(10, 45);
  tft.printf("Temp:");
  tft.setTextSize(2);
  tft.setCursor(10, 60);
  tft.printf("%.1f C", temperature);

  // Humidity (Blue)
  tft.setTextColor(TFT_BLUE, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(130, 45);
  tft.printf("Humidity:");
  tft.setTextSize(2);
  tft.setCursor(130, 60);
  tft.printf("%.1f%%", humidity);

  // Pressure (Orange)
  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(10, 85);
  tft.printf("Pressure:");
  tft.setTextSize(2);
  tft.setCursor(10, 100);
  tft.printf("%.0fhPa", pressure);

  // Air Quality (Yellow)
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(130, 85);
  tft.printf("Air Quality:");
  tft.setTextSize(2);
  tft.setCursor(130, 100);
  tft.printf("%.0f PPM", airQuality);

  // WiFi Status
  tft.setTextSize(1);
  tft.setCursor(10, 120);
  if (wifiConnected)
  {
    tft.setTextColor(TFT_GREEN, TFT_BLACK);
    tft.printf("WiFi: Connected (%s)", WiFi.localIP().toString().c_str());
  }
  else
  {
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.printf("WiFi: Disconnected");
  }

  // Uptime
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(150, 130);
  tft.printf("Uptime:");
  tft.print(formatUptime(millis() / 1000));
}

// MARK: - Setup
void setup()
{
  Serial.begin(115200);
  Serial.println("Starting Environmental Monitor...");

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // fino a ~3.3V

  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(1);

  displayStatus("Initializing...", TFT_YELLOW);

  // Start I2C
  Wire.begin(21, 22); // SDA, SCL for LilyGo T-Display

  // Initialize ATHX0 Sensor
  if (!ath.begin())
  {
    Serial.println("Error initializing ATHX0 sensor!");
    displayStatus("ATHX0 Error!", TFT_RED);
    while (1)
      delay(1000);
  }

  if (!bmp.begin(0x76))
  {
    if (!bmp.begin(0x77))
    {
      Serial.println("Error initializing BMP280 sensor!");
      displayStatus("BMP280 Error!", TFT_RED);
      while (1)
        delay(1000);
    }
  }
  bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,     /* Operating Mode. */
                  Adafruit_BMP280::SAMPLING_X2,     /* Temp. oversampling */
                  Adafruit_BMP280::SAMPLING_X16,    /* Pressure oversampling */
                  Adafruit_BMP280::FILTER_X16,      /* Filtering. */
                  Adafruit_BMP280::STANDBY_MS_500); /* Standby time. */

  pinMode(MQ135_PIN, INPUT);

  displayStatus("Initialization Done", TFT_GREEN);
  Serial.println("Initialization complete.");
  delay(1000);

  connectToWiFi();

  webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); // Try to reconnect every 5 seconds

  Serial.println("Setup complete.");
  displayStatus("Setup Complete", TFT_GREEN);
  delay(1000);
}

// MARK: - Send Data to Server
void sendDataToServer()
{
  if (!wifiConnected)
    return;
  WiFiClientSecure client;

  client.setInsecure(); // <-- HTTPS without certificate validation

  // Prepare HTTP POST request
  HTTPClient http;
  http.begin(client, serverURL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["temperature"] = round(temperature * 100.0) / 100.0;
  doc["humidity"] = round(humidity * 100.0) / 100.0;
  doc["pressure"] = round(pressure * 100.0) / 100.0;
  doc["airQuality"] = round(airQuality * 100.0) / 100.0;

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.println("Sending data to server:");
  Serial.println(jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0)
  {
    String response = http.getString();
    Serial.printf("Server response [%d]: %s\n", httpResponseCode, response.c_str());

    if (httpResponseCode == 201)
    {
      Serial.println("Data sent successfully.");
      tft.fillCircle(230, 10, 5, TFT_GREEN); // Indicate success
    }
  }
  else
  {
    Serial.printf("Error sending data. HTTP response code: %d\n", httpResponseCode);
    tft.fillCircle(230, 10, 5, TFT_RED); // Indicate failure
  }
  http.end();
}

void sendDataViaWebSocket()
{
  if (wifiConnected)
  {
    if (!webSocket.isConnected())
    {
      return;
    }

    StaticJsonDocument<200> doc;
    doc["deviceId"] = deviceId;
    doc["timestamp"] = millis();
    doc["temperature"] = round(temperature * 100.0) / 100.0;
    doc["humidity"] = round(humidity * 100.0) / 100.0;
    doc["pressure"] = round(pressure * 100.0) / 100.0;
    doc["airQuality"] = round(airQuality * 100.0) / 100.0;

    String jsonString;
    serializeJson(doc, jsonString);

    webSocket.sendTXT(jsonString);

    Serial.println("[WS] Sent:");
    Serial.println(jsonString);
  }
}

// MARK: - Loop
void loop()
{
  webSocket.loop();

  unsigned long currentMillis = millis();

  if (WiFi.status() != WL_CONNECTED)
  {
    wifiConnected = false;
    if (currentMillis - lastWifiTry >= WIFI_RETRY_INTERVAL)
    {
      connectToWiFi();
    }
  }
  else
  {
    wifiConnected = true;
  }

  // Read sensors
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL)
  {
    readSensors();
    lastSensorRead = currentMillis;
  }

  // Update display
  if (currentMillis - lastDisplayUpdate >= DISPLAY_INTERVAL)
  {
    updateDisplay();
    lastDisplayUpdate = currentMillis;
  }

  // Send data to server
  if (currentMillis - lastDataSend >= SEND_INTERVAL)
  {
    sendDataToServer();
    lastDataSend = currentMillis;
  }

  delay(200);
}

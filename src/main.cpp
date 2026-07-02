#include <Arduino.h>
#include <DHT.h>

// ── Pines ─────────────────────────────────────────────────────────────────────
#define PIN_DHT       2
#define PIN_TRIG1     7   // HC-SR04 sensor 1
#define PIN_ECHO1     8
#define PIN_TRIG2     3   // HC-SR04 sensor 2
#define PIN_ECHO2     4
#define PIN_VERDE     6
#define PIN_AMARILLO  10
#define PIN_ROJO      11

// ── Umbrales ──────────────────────────────────────────────────────────────────
#define UMBRAL_HUM_CAMANCHACA  80.0f
#define UMBRAL_DIST_MIN_CM      6.0f
#define UMBRAL_DIST_MAX_CM     12.0f
#define UMBRAL_DETENIDO_CM      1.0f   // variación máxima para considerar "quieto"
#define MS_PARA_ROJO         3000UL   // ms inmóvil para activar rojo

// ── Sensor DHT11 ──────────────────────────────────────────────────────────────
DHT dht(PIN_DHT, DHT11);

// ── Estado detección vehículo ─────────────────────────────────────────────────
float         distPrevActiva = -1.0f;
unsigned long msDetenido     = 0;
unsigned long ultimoLoopMs   = 0;

void resetEstado() {
    distPrevActiva = -1.0f;
    msDetenido     = 0;
    ultimoLoopMs   = millis();
}

// ── Lectura HC-SR04 ───────────────────────────────────────────────────────────
float leerDistanciaCm(uint8_t pinTrig, uint8_t pinEcho) {
    digitalWrite(pinTrig, LOW);
    delayMicroseconds(2);
    digitalWrite(pinTrig, HIGH);
    delayMicroseconds(10);
    digitalWrite(pinTrig, LOW);
    // timeout: 200µs burst + (12cm*2/0.0343) ~899µs; 1100µs da margen
    long dur = pulseIn(pinEcho, HIGH, 1100UL);
    if (dur == 0) return -1.0f;
    return (dur * 0.0343f) / 2.0f;
}

inline bool enZona(float dist) {
    return dist >= UMBRAL_DIST_MIN_CM && dist <= UMBRAL_DIST_MAX_CM;
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(9600);

    pinMode(PIN_TRIG1,    OUTPUT);
    pinMode(PIN_ECHO1,    INPUT);
    pinMode(PIN_TRIG2,    OUTPUT);
    pinMode(PIN_ECHO2,    INPUT);
    pinMode(PIN_VERDE,    OUTPUT);
    pinMode(PIN_AMARILLO, OUTPUT);
    pinMode(PIN_ROJO,     OUTPUT);

    digitalWrite(PIN_VERDE,    LOW);
    digitalWrite(PIN_AMARILLO, LOW);
    digitalWrite(PIN_ROJO,     LOW);

    dht.begin();
    resetEstado();

    Serial.println(F("=== Sistema Camanchaca UCN ==="));
    delay(2000);
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
    unsigned long ahora = millis();
    unsigned long dt    = ahora - ultimoLoopMs;
    ultimoLoopMs = ahora;

    // --- DHT11 ---
    float hum  = dht.readHumidity();
    float temp = dht.readTemperature();

    if (isnan(hum)) {
        digitalWrite(PIN_VERDE, LOW);
        Serial.print(F("Hum:ERR"));
    } else {
        digitalWrite(PIN_VERDE, hum > UMBRAL_HUM_CAMANCHACA ? HIGH : LOW);
        Serial.print(F("Hum:")); Serial.print(hum, 0); Serial.print(F("%"));
    }

    Serial.print(F("  Temp:"));
    if (isnan(temp)) Serial.print(F("ERR"));
    else             { Serial.print(temp, 1); Serial.print(F("C")); }

    // --- HC-SR04 x2 ---
    float dist1 = leerDistanciaCm(PIN_TRIG1, PIN_ECHO1);
    delay(5);
    float dist2 = leerDistanciaCm(PIN_TRIG2, PIN_ECHO2);

    bool z1 = enZona(dist1);
    bool z2 = enZona(dist2);

    Serial.print(F("  S1:"));
    if (dist1 < 0) Serial.print(F("---"));
    else           { Serial.print(dist1, 1); Serial.print(F("cm")); }

    Serial.print(F("  S2:"));
    if (dist2 < 0) Serial.print(F("---"));
    else           { Serial.print(dist2, 1); Serial.print(F("cm")); }

    if (!z1 && !z2) {
        resetEstado();
        digitalWrite(PIN_AMARILLO, LOW);
        digitalWrite(PIN_ROJO,     LOW);
        Serial.println(F("  -> SIN VEHICULO"));
    } else {
        float distActiva = (z1 && z2) ? (dist1 + dist2) / 2.0f
                         : z1         ? dist1
                         :              dist2;

        // Acumula tiempo inmóvil; resetea si se movió más de UMBRAL_DETENIDO_CM
        if (distPrevActiva >= 0.0f &&
            distActiva >= distPrevActiva - UMBRAL_DETENIDO_CM &&
            distActiva <= distPrevActiva + UMBRAL_DETENIDO_CM) {
            msDetenido += dt;
        } else {
            msDetenido = 0;
        }
        distPrevActiva = distActiva;

        if (msDetenido >= MS_PARA_ROJO) {
            digitalWrite(PIN_AMARILLO, LOW);
            digitalWrite(PIN_ROJO,     HIGH);
            Serial.println(F("  -> DETENIDO [ROJO]"));
        } else {
            digitalWrite(PIN_AMARILLO, HIGH);
            digitalWrite(PIN_ROJO,     LOW);
            Serial.println(F("  -> EN MOVIMIENTO [AMARILLO]"));
        }
    }

    delay(100);
}

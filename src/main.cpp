#include <Arduino.h>
#include <DHT.h>

// ── Pines ─────────────────────────────────────────────────────────────────────
#define PIN_DHT      2
#define PIN_TRIG     7
#define PIN_ECHO     8
#define PIN_VERDE    6
#define PIN_AMARILLO 10
#define PIN_ROJO     11

// ── Umbrales ──────────────────────────────────────────────────────────────────
#define UMBRAL_HUM_CAMANCHACA  75.0f   // % → verdes ON (niebla leve o superior)
#define UMBRAL_DIST_MIN_CM      2.0f   // cm → límite inferior HC-SR04
#define UMBRAL_DIST_MAX_CM      5.0f   // cm → límite superior zona de detección
#define UMBRAL_DETENIDO_CM      1.0f   // variación máxima para considerar detenido
#define NUM_LECTURAS_HIST         5    // lecturas para detectar vehículo detenido

// ── Sensor DHT11 ──────────────────────────────────────────────────────────────
DHT dht(PIN_DHT, DHT11);

// ── Historial de distancias ───────────────────────────────────────────────────
float historial[NUM_LECTURAS_HIST];
uint8_t idxHist     = 0;
bool    histLleno   = false;

void resetHistorial() {
    for (uint8_t i = 0; i < NUM_LECTURAS_HIST; i++) historial[i] = 0.0f;
    idxHist   = 0;
    histLleno = false;
}

void agregarLectura(float dist) {
    historial[idxHist] = dist;
    idxHist = (idxHist + 1) % NUM_LECTURAS_HIST;
    if (idxHist == 0) histLleno = true;
}

bool vehiculoDetenido() {
    if (!histLleno) return false;
    float minD = historial[0], maxD = historial[0];
    for (uint8_t i = 1; i < NUM_LECTURAS_HIST; i++) {
        if (historial[i] < minD) minD = historial[i];
        if (historial[i] > maxD) maxD = historial[i];
    }
    return (maxD - minD) <= UMBRAL_DETENIDO_CM;
}

// ── Lectura HC-SR04 ───────────────────────────────────────────────────────────
float leerDistanciaCm() {
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);
    // timeout = UMBRAL_DIST_MAX_CM * 2 / 0.0343 ≈ 292 µs; 600 µs da margen ×2 (~10 cm max)
    // Si se sube UMBRAL_DIST_MAX_CM, actualizar también este timeout.
    long dur = pulseIn(PIN_ECHO, HIGH, 600UL);
    if (dur == 0) return -1.0f;
    return (dur * 0.0343f) / 2.0f;
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(9600);

    pinMode(PIN_TRIG,     OUTPUT);
    pinMode(PIN_ECHO,     INPUT);
    pinMode(PIN_VERDE,    OUTPUT);
    pinMode(PIN_AMARILLO, OUTPUT);
    pinMode(PIN_ROJO,     OUTPUT);

    digitalWrite(PIN_VERDE,    LOW);
    digitalWrite(PIN_AMARILLO, LOW);
    digitalWrite(PIN_ROJO,     LOW);

    dht.begin();
    resetHistorial();

    Serial.println(F("=== Sistema Camanchaca UCN ==="));
    delay(2000);
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
    // --- DHT11: humedad y temperatura ---
    float hum  = dht.readHumidity();
    float temp = dht.readTemperature();

    if (isnan(hum)) {
        digitalWrite(PIN_VERDE, LOW);
        Serial.print(F("Hum:ERR"));
    } else {
        digitalWrite(PIN_VERDE, hum >= UMBRAL_HUM_CAMANCHACA ? HIGH : LOW);
        Serial.print(F("Hum:"));
        Serial.print(hum, 0);
        Serial.print(F("%"));
    }

    Serial.print(F("  Temp:"));
    if (isnan(temp)) Serial.print(F("ERR"));
    else { Serial.print(temp, 1); Serial.print(F("C")); }

    // --- HC-SR04: distancia → LEDs amarillo/rojo ---
    float dist = leerDistanciaCm();

    Serial.print(F("  Dist:"));
    if (dist < 0) Serial.print(F("---"));
    else { Serial.print(dist, 1); Serial.print(F("cm")); }

    if (dist < 0) {
        // Timeout del sensor: mantiene estado anterior sin tocar historial ni LEDs
        Serial.println(F("  -> SIN SEÑAL"));
    } else if (dist < UMBRAL_DIST_MIN_CM || dist > UMBRAL_DIST_MAX_CM) {
        // Fuera de rango → sin vehículo, resetear historial
        resetHistorial();
        digitalWrite(PIN_AMARILLO, LOW);
        digitalWrite(PIN_ROJO,     LOW);
        Serial.println(F("  -> SIN VEHICULO"));
    } else {
        // Vehículo en zona → acumular lectura y decidir
        agregarLectura(dist);

        if (vehiculoDetenido()) {
            digitalWrite(PIN_AMARILLO, LOW);
            digitalWrite(PIN_ROJO,     HIGH);
            Serial.println(F("  -> DETENIDO [ROJO]"));
        } else {
            digitalWrite(PIN_AMARILLO, HIGH);
            digitalWrite(PIN_ROJO,     LOW);
            Serial.println(F("  -> EN MOVIMIENTO [AMARILLO]"));
        }
    }

    delay(200);
}

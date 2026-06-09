#include <Arduino.h>
#include <DHT.h>

// ── Pines ─────────────────────────────────────────────────────────────────────
#define PIN_DHT       2
#define PIN_TRIG1     7
#define PIN_ECHO1     8
#define PIN_TRIG2     3
#define PIN_ECHO2     4
#define PIN_VERDE     6
#define PIN_AMARILLO  10
#define PIN_ROJO      11

// ── Umbrales ──────────────────────────────────────────────────────────────────
#define UMBRAL_HUM_CAMANCHACA  80.0f
#define DIST_MIN_CM             2.0f
#define DIST_MAX_CM            30.0f
#define UMBRAL_MOV_CM           1.5f    // variación mínima entre lecturas para considerar movimiento
#define TIEMPO_DETENIDO_MS   3000UL    // ms sin moverse → DETENIDO [ROJO]
#define TIEMPO_HOLD_MS       2000UL    // ms que se mantiene amarillo tras perder el vehículo

// ── Sensor DHT11 ──────────────────────────────────────────────────────────────
DHT dht(PIN_DHT, DHT11);

// ── Estado por sensor sonar ───────────────────────────────────────────────────
enum EstadoSensor : uint8_t { SIN_VEHICULO, EN_MOVIMIENTO, DETENIDO };

struct SensorSonar {
    uint8_t       pinTrig;
    uint8_t       pinEcho;
    bool          presente;
    float         distActual;
    float         distPrev;
    unsigned long ultimoMovimiento;  // última vez que la distancia cambió > UMBRAL_MOV_CM
    unsigned long ultimaDeteccion;   // última vez que hubo objeto en rango
    EstadoSensor  estado;
};

SensorSonar s1 = { PIN_TRIG1, PIN_ECHO1, false, -1.0f, -1.0f, 0, 0, SIN_VEHICULO };
SensorSonar s2 = { PIN_TRIG2, PIN_ECHO2, false, -1.0f, -1.0f, 0, 0, SIN_VEHICULO };

// ── Lectura HC-SR04 ───────────────────────────────────────────────────────────
float leerDistancia(uint8_t pinTrig, uint8_t pinEcho) {
    digitalWrite(pinTrig, LOW);
    delayMicroseconds(2);
    digitalWrite(pinTrig, HIGH);
    delayMicroseconds(10);
    digitalWrite(pinTrig, LOW);
    long dur = pulseIn(pinEcho, HIGH, 3000UL);  // timeout 3 ms — el filtro de rango lo hace DIST_MAX_CM
    if (dur == 0) return -1.0f;
    return (dur * 0.0343f) / 2.0f;
}

// ── Evaluación por sensor ─────────────────────────────────────────────────────
void evaluarSensor(SensorSonar &s) {
    float dist = leerDistancia(s.pinTrig, s.pinEcho);
    unsigned long ahora = millis();

    if (dist >= DIST_MIN_CM && dist <= DIST_MAX_CM) {
        s.distActual      = dist;
        s.ultimaDeteccion = ahora;

        if (!s.presente) {
            s.presente          = true;
            s.distPrev          = dist;
            s.ultimoMovimiento  = ahora;
        }

        if (fabsf(dist - s.distPrev) > UMBRAL_MOV_CM) {
            s.ultimoMovimiento = ahora;
        }
        s.distPrev = dist;

        s.estado = (ahora - s.ultimoMovimiento >= TIEMPO_DETENIDO_MS)
                   ? DETENIDO : EN_MOVIMIENTO;
    } else {
        s.presente   = false;
        s.distActual = -1.0f;

        // Mantener amarillo TIEMPO_HOLD_MS tras perder el vehículo (si no estaba detenido)
        if (s.estado != DETENIDO && (ahora - s.ultimaDeteccion) < TIEMPO_HOLD_MS) {
            s.estado = EN_MOVIMIENTO;
        } else {
            s.estado = SIN_VEHICULO;
        }
    }
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
        digitalWrite(PIN_VERDE, hum > UMBRAL_HUM_CAMANCHACA ? HIGH : LOW);
        Serial.print(F("Hum:")); Serial.print(hum, 0); Serial.print(F("%"));
    }

    Serial.print(F("  Temp:"));
    if (isnan(temp)) Serial.print(F("ERR"));
    else { Serial.print(temp, 1); Serial.print(F("C")); }

    // --- HC-SR04 x2 ---
    evaluarSensor(s1);
    evaluarSensor(s2);

    Serial.print(F("  Dist1:"));
    if (s1.distActual < 0) Serial.print(F("---"));
    else { Serial.print(s1.distActual, 1); Serial.print(F("cm")); }

    Serial.print(F("  Dist2:"));
    if (s2.distActual < 0) Serial.print(F("---"));
    else { Serial.print(s2.distActual, 1); Serial.print(F("cm")); }

    // --- Estado combinado: el más crítico manda ---
    EstadoSensor combinado;
    if      (s1.estado == DETENIDO     || s2.estado == DETENIDO)     combinado = DETENIDO;
    else if (s1.estado == EN_MOVIMIENTO || s2.estado == EN_MOVIMIENTO) combinado = EN_MOVIMIENTO;
    else                                                               combinado = SIN_VEHICULO;

    switch (combinado) {
        case DETENIDO:
            digitalWrite(PIN_AMARILLO, LOW);
            digitalWrite(PIN_ROJO,     HIGH);
            Serial.println(F("  -> DETENIDO [ROJO]"));
            break;
        case EN_MOVIMIENTO:
            digitalWrite(PIN_AMARILLO, HIGH);
            digitalWrite(PIN_ROJO,     LOW);
            Serial.println(F("  -> EN MOVIMIENTO [AMARILLO]"));
            break;
        default:
            digitalWrite(PIN_AMARILLO, LOW);
            digitalWrite(PIN_ROJO,     LOW);
            Serial.println(F("  -> SIN VEHICULO"));
    }

    delay(200);
}

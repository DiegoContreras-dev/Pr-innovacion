#include <Arduino.h>
#include "sensors/SensorHumedad.h"
#include "sensors/SensorLuz.h"
#include "sensors/SensorDistancia.h"
#include "processing/DetectorNiebla.h"
#include "processing/DetectorVehiculo.h"
#include "logic/NivelRiesgo.h"
#include "actuators/ControladorLED.h"

// ── Pines ─────────────────────────────────────────────────────────────────────
#define PIN_DHT   4
#define PIN_LDR   A0
#define PIN_TRIG  9
#define PIN_ECHO  10
#define PIN_LEDS  6
#define NUM_LEDS  10

// ── Capa 1 — Sensores ─────────────────────────────────────────────────────────
SensorHumedad   sensorHum(PIN_DHT);
SensorLuz       sensorLuz(PIN_LDR);
SensorDistancia sensorDist(PIN_TRIG, PIN_ECHO);

// ── Capa 2 — Procesamiento ────────────────────────────────────────────────────
DetectorNiebla   detNiebla(sensorHum, sensorLuz);
DetectorVehiculo detVehiculo(sensorDist);

// ── Capa 3 — Lógica ───────────────────────────────────────────────────────────
NivelRiesgo nivelRiesgo(detNiebla, detVehiculo);

// ── Capa 4 — Actuadores ───────────────────────────────────────────────────────
ControladorLED led(PIN_LEDS, NUM_LEDS);

// ── Control de ciclo ──────────────────────────────────────────────────────────
static const unsigned long INTERVALO_EVALUACION_MS = 500;
static unsigned long tUltimaEvaluacion = 0;
static Estado estadoActual = Estado::NORMAL;

void setup() {
    Serial.begin(9600);
    sensorHum.begin();
    sensorLuz.begin();
    sensorDist.begin();
    led.begin();
    Serial.println(F("Sistema Camanchaca iniciado."));
}

void loop() {
    unsigned long ahora = millis();

    // Evaluar estado cada INTERVALO_EVALUACION_MS
    if (ahora - tUltimaEvaluacion >= INTERVALO_EVALUACION_MS) {
        tUltimaEvaluacion = ahora;
        estadoActual = nivelRiesgo.evaluar();

        Serial.print(F("Estado: "));
        switch (estadoActual) {
            case Estado::NORMAL:          Serial.println(F("NORMAL"));          break;
            case Estado::NIEBLA:          Serial.println(F("NIEBLA"));          break;
            case Estado::ALERTA_AMARILLA: Serial.println(F("ALERTA AMARILLA")); break;
            case Estado::ALERTA_ROJA:     Serial.println(F("ALERTA ROJA"));     break;
        }
    }

    // Actualizar LEDs en cada ciclo (necesario para el efecto cascada continuo)
    led.actualizar(estadoActual, ahora);
}

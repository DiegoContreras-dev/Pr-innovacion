#include <Arduino.h>
#include "sensors/SensorHumedad.h"
#include "sensors/SensorDistancia.h"
#include "processing/DetectorNiebla.h"
#include "processing/DetectorVehiculo.h"
#include "logic/NivelRiesgo.h"
#include "actuators/ControladorLED.h"

#define PIN_DHT   2
#define PIN_TRIG  9
#define PIN_ECHO  10
#define PIN_LEDS  6
#define NUM_LEDS  10

SensorHumedad   sensorHum(PIN_DHT, DHT11);
SensorDistancia sensorDist(PIN_TRIG, PIN_ECHO);
DetectorNiebla   detNiebla(sensorHum);
DetectorVehiculo detVehiculo(sensorDist);
NivelRiesgo nivelRiesgo(detNiebla, detVehiculo);
ControladorLED led(PIN_LEDS, NUM_LEDS);

static const unsigned long INTERVALO_MS = 2000;
static unsigned long tUltima = 0;
static Estado estadoActual = Estado::NORMAL;

void setup() {
    Serial.begin(9600);
    sensorHum.begin();
    sensorDist.begin();
    led.begin();
    Serial.println(F("=== Sistema Camanchaca ==="));
    delay(2000);
}

void loop() {
    unsigned long ahora = millis();

    if (ahora - tUltima >= INTERVALO_MS) {
        tUltima = ahora;
        estadoActual = nivelRiesgo.evaluar();

        float hum  = sensorHum.leerHumedad();
        float dist = sensorDist.leerDistanciaCm();

        Serial.print(F("Hum:"));
        if (hum < 0) Serial.print(F("ERR"));
        else { Serial.print(hum, 0); Serial.print(F("%")); }

        Serial.print(F("  Dist:"));
        if (dist < 0) Serial.print(F("---"));
        else { Serial.print(dist, 1); Serial.print(F("cm")); }

        Serial.print(F("  Niebla:"));
        switch (nivelRiesgo.ultimaNiebla()) {
            case NivelNiebla::SIN_NIEBLA:   Serial.print(F("SIN"));   break;
            case NivelNiebla::NIEBLA_LEVE:  Serial.print(F("LEVE"));  break;
            case NivelNiebla::NIEBLA_DENSA: Serial.print(F("DENSA")); break;
        }

        Serial.print(F("  Vehiculo:"));
        switch (nivelRiesgo.ultimoVehiculo()) {
            case EstadoVehiculo::SIN_VEHICULO:      Serial.print(F("SIN"));      break;
            case EstadoVehiculo::VEHICULO_LENTO:    Serial.print(F("LENTO"));    break;
            case EstadoVehiculo::VEHICULO_DETENIDO: Serial.print(F("DETENIDO")); break;
        }

        Serial.print(F("  -> "));
        switch (estadoActual) {
            case Estado::NORMAL:          Serial.println(F("NORMAL"));          break;
            case Estado::NIEBLA:          Serial.println(F("NIEBLA"));          break;
            case Estado::ALERTA_AMARILLA: Serial.println(F("ALERTA AMARILLA")); break;
            case Estado::ALERTA_ROJA:     Serial.println(F("ALERTA ROJA"));     break;
        }
    }

    led.actualizar(estadoActual, ahora);
}

#include "sensors/SensorDistancia.h"

const float SensorDistancia::MAX_DISTANCIA_CM = 400.0f;

SensorDistancia::SensorDistancia(uint8_t pinTrig, uint8_t pinEcho)
    : _pinTrig(pinTrig), _pinEcho(pinEcho) {}

void SensorDistancia::begin() {
    pinMode(_pinTrig, OUTPUT);
    pinMode(_pinEcho, INPUT);
}

float SensorDistancia::leerDistanciaCm() {
    digitalWrite(_pinTrig, LOW);
    delayMicroseconds(2);
    digitalWrite(_pinTrig, HIGH);
    delayMicroseconds(10);
    digitalWrite(_pinTrig, LOW);

    long duracion = pulseIn(_pinEcho, HIGH, 30000UL); // timeout 30 ms (~514cm, cubre HC-SR04 completo)
    if (duracion == 0) return -1.0f;

    float distancia = (duracion * 0.0343f) / 2.0f;
    return (distancia > MAX_DISTANCIA_CM) ? -1.0f : distancia;
}

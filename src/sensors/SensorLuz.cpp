#include "sensors/SensorLuz.h"

SensorLuz::SensorLuz(uint8_t pin) : _pin(pin) {}

void SensorLuz::begin() {
    pinMode(_pin, INPUT);
}

int SensorLuz::leerRaw() {
    return analogRead(_pin);
}

float SensorLuz::leerPorcentaje() {
    return (leerRaw() / 1023.0f) * 100.0f;
}

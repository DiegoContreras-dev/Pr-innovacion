#include "sensors/SensorHumedad.h"

SensorHumedad::SensorHumedad(uint8_t pin, uint8_t tipo)
    : _dht(pin, tipo) {}

void SensorHumedad::begin() {
    _dht.begin();
}

float SensorHumedad::leerHumedad() {
    float h = _dht.readHumidity();
    return isnan(h) ? -1.0f : h;
}

float SensorHumedad::leerTemperatura() {
    float t = _dht.readTemperature();
    return isnan(t) ? -1.0f : t;
}

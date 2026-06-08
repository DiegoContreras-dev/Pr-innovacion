#pragma once
#include <Arduino.h>

class SensorLuz {
public:
    explicit SensorLuz(uint8_t pin);
    void  begin();
    int   leerRaw();          // 0–1023  (0 = oscuro, 1023 = máx. luz)
    float leerPorcentaje();   // 0.0–100.0
private:
    uint8_t _pin;
};

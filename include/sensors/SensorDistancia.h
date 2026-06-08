#pragma once
#include <Arduino.h>

class SensorDistancia {
public:
    SensorDistancia(uint8_t pinTrig, uint8_t pinEcho);
    void  begin();
    float leerDistanciaCm();  // retorna distancia en cm, o -1 si fuera de rango
private:
    uint8_t _pinTrig;
    uint8_t _pinEcho;
    static const float MAX_DISTANCIA_CM;
};

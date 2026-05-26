#pragma once
#include <Arduino.h>
#include "sensors/SensorDistancia.h"

enum class EstadoVehiculo : uint8_t {
    SIN_VEHICULO      = 0,
    VEHICULO_LENTO    = 1,
    VEHICULO_DETENIDO = 2
};

class DetectorVehiculo {
public:
    explicit DetectorVehiculo(SensorDistancia& sensor);
    EstadoVehiculo evaluar();

    // Umbrales ajustables (escala prototipo)
    static constexpr float DISTANCIA_MAX_CM        = 50.0f; // rango de detección
    static constexpr float VELOCIDAD_LENTO_CM_S    = 10.0f; // cm/s → vehículo lento
    static constexpr float VELOCIDAD_DETENIDO_CM_S =  2.0f; // cm/s → detenido
private:
    SensorDistancia& _sensor;
    float            _distanciaAnterior;
    unsigned long    _tAnterior;
};

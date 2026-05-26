#pragma once
#include "sensors/SensorHumedad.h"
#include "sensors/SensorLuz.h"

enum class NivelNiebla : uint8_t {
    SIN_NIEBLA   = 0,
    NIEBLA_LEVE  = 1,
    NIEBLA_DENSA = 2
};

class DetectorNiebla {
public:
    DetectorNiebla(SensorHumedad& sensorHum, SensorLuz& sensorLuz);
    NivelNiebla evaluar();

    // Umbrales ajustables para calibración del prototipo
    static constexpr float UMBRAL_HUM_LEVE  = 80.0f;  // % humedad relativa
    static constexpr float UMBRAL_HUM_DENSA = 90.0f;  // % humedad relativa
    static constexpr int   UMBRAL_LUZ_BAJA  = 300;    // raw 0–1023
private:
    SensorHumedad& _sensorHum;
    SensorLuz&     _sensorLuz;
};

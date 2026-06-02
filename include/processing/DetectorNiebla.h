#pragma once
#include "sensors/SensorHumedad.h"

enum class NivelNiebla : uint8_t {
    SIN_NIEBLA   = 0,
    NIEBLA_LEVE  = 1,
    NIEBLA_DENSA = 2
};

class DetectorNiebla {
public:
    explicit DetectorNiebla(SensorHumedad& sensorHum);
    NivelNiebla evaluar();

    static constexpr float UMBRAL_HUM_LEVE  = 75.0f;
    static constexpr float UMBRAL_HUM_DENSA = 85.0f;
private:
    SensorHumedad& _sensorHum;
};

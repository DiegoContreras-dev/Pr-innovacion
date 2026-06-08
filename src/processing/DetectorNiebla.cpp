#include "processing/DetectorNiebla.h"

DetectorNiebla::DetectorNiebla(SensorHumedad& sensorHum)
    : _sensorHum(sensorHum) {}

NivelNiebla DetectorNiebla::evaluar() {
    float humedad = _sensorHum.leerHumedad();

    if (humedad < 0) return NivelNiebla::SIN_NIEBLA;

    if (humedad >= UMBRAL_HUM_DENSA) return NivelNiebla::NIEBLA_DENSA;
    if (humedad >= UMBRAL_HUM_LEVE)  return NivelNiebla::NIEBLA_LEVE;
    return NivelNiebla::SIN_NIEBLA;
}

#include "processing/DetectorNiebla.h"

DetectorNiebla::DetectorNiebla(SensorHumedad& sensorHum, SensorLuz& sensorLuz)
    : _sensorHum(sensorHum), _sensorLuz(sensorLuz) {}

NivelNiebla DetectorNiebla::evaluar() {
    float humedad = _sensorHum.leerHumedad();
    int   luz     = _sensorLuz.leerRaw();

    if (humedad < 0) return NivelNiebla::SIN_NIEBLA; // error de lectura

    bool luzBaja = (luz >= 0 && luz < UMBRAL_LUZ_BAJA);

    if (humedad >= UMBRAL_HUM_DENSA && luzBaja) {
        return NivelNiebla::NIEBLA_DENSA;
    }
    if (humedad >= UMBRAL_HUM_LEVE) {
        return NivelNiebla::NIEBLA_LEVE;
    }
    return NivelNiebla::SIN_NIEBLA;
}

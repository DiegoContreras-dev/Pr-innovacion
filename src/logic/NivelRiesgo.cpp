#include "logic/NivelRiesgo.h"

NivelRiesgo::NivelRiesgo(DetectorNiebla& detNiebla, DetectorVehiculo& detVehiculo)
    : _detNiebla(detNiebla), _detVehiculo(detVehiculo),
      _ultimaNiebla(NivelNiebla::SIN_NIEBLA),
      _ultimoVehiculo(EstadoVehiculo::SIN_VEHICULO) {}

Estado NivelRiesgo::evaluar() {
    _ultimaNiebla   = _detNiebla.evaluar();
    _ultimoVehiculo = _detVehiculo.evaluar();

    // Vehículo detenido: alerta roja siempre, con o sin niebla
    if (_ultimoVehiculo == EstadoVehiculo::VEHICULO_DETENIDO) {
        return Estado::ALERTA_ROJA;
    }

    // Sin niebla y sin anomalías vehiculares → normal
    if (_ultimaNiebla == NivelNiebla::SIN_NIEBLA) {
        return Estado::NORMAL;
    }

    // Niebla activa + vehículo lento adelante → alerta amarilla
    if (_ultimoVehiculo == EstadoVehiculo::VEHICULO_LENTO) {
        return Estado::ALERTA_AMARILLA;
    }

    // Niebla activa, sin vehículos anómalos → guía estándar azul
    return Estado::NIEBLA;
}

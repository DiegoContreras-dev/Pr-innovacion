#include "logic/NivelRiesgo.h"

NivelRiesgo::NivelRiesgo(DetectorNiebla& detNiebla, DetectorVehiculo& detVehiculo)
    : _detNiebla(detNiebla), _detVehiculo(detVehiculo) {}

Estado NivelRiesgo::evaluar() {
    NivelNiebla    niebla   = _detNiebla.evaluar();
    EstadoVehiculo vehiculo = _detVehiculo.evaluar();

    // Vehículo detenido: alerta roja siempre, con o sin niebla
    if (vehiculo == EstadoVehiculo::VEHICULO_DETENIDO) {
        return Estado::ALERTA_ROJA;
    }

    // Sin niebla y sin anomalías vehiculares → normal
    if (niebla == NivelNiebla::SIN_NIEBLA) {
        return Estado::NORMAL;
    }

    // Niebla activa + vehículo lento adelante → alerta amarilla
    if (vehiculo == EstadoVehiculo::VEHICULO_LENTO) {
        return Estado::ALERTA_AMARILLA;
    }

    // Niebla activa, sin vehículos anómalos → guía estándar azul
    return Estado::NIEBLA;
}

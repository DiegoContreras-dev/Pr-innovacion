#pragma once
#include "processing/DetectorNiebla.h"
#include "processing/DetectorVehiculo.h"
#include "logic/EstadoSistema.h"

class NivelRiesgo {
public:
    NivelRiesgo(DetectorNiebla& detNiebla, DetectorVehiculo& detVehiculo);
    Estado evaluar();

    NivelNiebla    ultimaNiebla()   const { return _ultimaNiebla; }
    EstadoVehiculo ultimoVehiculo() const { return _ultimoVehiculo; }
private:
    DetectorNiebla&   _detNiebla;
    DetectorVehiculo& _detVehiculo;
    NivelNiebla       _ultimaNiebla;
    EstadoVehiculo    _ultimoVehiculo;
};

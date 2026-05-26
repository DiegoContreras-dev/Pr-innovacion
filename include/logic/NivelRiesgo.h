#pragma once
#include "processing/DetectorNiebla.h"
#include "processing/DetectorVehiculo.h"
#include "logic/EstadoSistema.h"

class NivelRiesgo {
public:
    NivelRiesgo(DetectorNiebla& detNiebla, DetectorVehiculo& detVehiculo);
    Estado evaluar();
private:
    DetectorNiebla&   _detNiebla;
    DetectorVehiculo& _detVehiculo;
};

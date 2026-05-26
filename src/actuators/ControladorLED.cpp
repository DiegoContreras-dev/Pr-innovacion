#include "actuators/ControladorLED.h"

// _strip se inicializa primero (declarado antes en el header),
// luego _cascada recibe la referencia ya construida.
ControladorLED::ControladorLED(uint8_t pin, uint16_t numLeds)
    : _strip(numLeds, pin, NEO_GRB + NEO_KHZ800),
      _cascada(_strip),
      _estadoAnterior(Estado::NORMAL) {}

void ControladorLED::begin() {
    _strip.begin();
    _strip.clear();
    _strip.show();
}

void ControladorLED::actualizar(Estado estado, unsigned long ahora) {
    if (estado == Estado::NORMAL) {
        apagar();
        return;
    }

    // Al cambiar de estado se reinicia la cascada para no mezclar colores
    if (estado != _estadoAnterior) {
        _cascada.resetear();
        _estadoAnterior = estado;
    }

    _cascada.actualizar(_colorParaEstado(estado), ahora);
}

void ControladorLED::apagar() {
    _strip.clear();
    _strip.show();
    _estadoAnterior = Estado::NORMAL;
}

uint32_t ControladorLED::_colorParaEstado(Estado estado) {
    switch (estado) {
        case Estado::NIEBLA:          return COLOR_AZUL;
        case Estado::ALERTA_AMARILLA: return COLOR_AMARILLO;
        case Estado::ALERTA_ROJA:     return COLOR_ROJO;
        default:                      return 0;
    }
}

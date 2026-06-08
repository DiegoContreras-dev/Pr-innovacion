#pragma once
#include <Adafruit_NeoPixel.h>
#include "logic/EstadoSistema.h"
#include "actuators/EfectoCascada.h"

class ControladorLED {
public:
    ControladorLED(uint8_t pin, uint16_t numLeds);
    void begin();
    void actualizar(Estado estado, unsigned long ahora);
    void apagar();

    // Colores por estado (formato 0x00RRGGBB)
    static constexpr uint32_t COLOR_AZUL    = 0x0000FFU; // NIEBLA
    static constexpr uint32_t COLOR_AMARILLO = 0xFFFF00U; // ALERTA_AMARILLA
    static constexpr uint32_t COLOR_ROJO    = 0xFF0000U; // ALERTA_ROJA
private:
    Adafruit_NeoPixel _strip;
    EfectoCascada     _cascada;
    Estado            _estadoAnterior;

    uint32_t _colorParaEstado(Estado estado);
};

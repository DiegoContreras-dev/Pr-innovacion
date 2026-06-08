#pragma once
#include <Arduino.h>
#include <Adafruit_NeoPixel.h>

// Efecto de encendido secuencial (cascada) con rastro de brillo decreciente.
// Representa la dirección de la vía en condiciones de camanchaca.
class EfectoCascada {
public:
    EfectoCascada(Adafruit_NeoPixel& strip, uint16_t intervaloMs = 80);
    void actualizar(uint32_t color, unsigned long ahora);
    void resetear();
private:
    Adafruit_NeoPixel& _strip;
    uint16_t           _intervaloMs;
    int                _indice;
    unsigned long      _tUltimo;
};

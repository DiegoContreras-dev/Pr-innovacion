#include "actuators/EfectoCascada.h"
#include <avr/pgmspace.h>

EfectoCascada::EfectoCascada(Adafruit_NeoPixel& strip, uint16_t intervaloMs)
    : _strip(strip), _intervaloMs(intervaloMs), _indice(0), _tUltimo(0) {}

void EfectoCascada::actualizar(uint32_t color, unsigned long ahora) {
    if (ahora - _tUltimo < _intervaloMs) return;
    _tUltimo = ahora;

    _strip.clear();

    // LED activo + rastro de 2 LEDs con brillo decreciente (100% → 50% → 20%)
    static const uint8_t FACTORES[] PROGMEM = { 255, 127, 50 };
    int total = _strip.numPixels();

    for (int trail = 0; trail < 3; trail++) {
        int idx = (_indice - trail + total) % total;
        uint8_t f = pgm_read_byte(&FACTORES[trail]);
        uint8_t r = (uint8_t)(((color >> 16) & 0xFF) * f / 255);
        uint8_t g = (uint8_t)(((color >>  8) & 0xFF) * f / 255);
        uint8_t b = (uint8_t)(((color      ) & 0xFF) * f / 255);
        _strip.setPixelColor(idx, _strip.Color(r, g, b));
    }

    _strip.show();
    _indice = (_indice + 1) % total;
}

void EfectoCascada::resetear() {
    _indice  = 0;
    _tUltimo = 0;
}

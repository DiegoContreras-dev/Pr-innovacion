#pragma once
#include <stdint.h>

enum class Estado : uint8_t {
    NORMAL          = 0,
    NIEBLA          = 1,
    ALERTA_AMARILLA = 2,
    ALERTA_ROJA     = 3
};

#include "processing/DetectorVehiculo.h"

DetectorVehiculo::DetectorVehiculo(SensorDistancia& sensor)
    : _sensor(sensor), _distanciaAnterior(-1.0f), _tAnterior(0) {}

EstadoVehiculo DetectorVehiculo::evaluar() {
    float distancia   = _sensor.leerDistanciaCm();
    unsigned long ahora = millis();

    // Fuera de rango → sin vehículo
    if (distancia < 0 || distancia > DISTANCIA_MAX_CM) {
        _distanciaAnterior = distancia;
        _tAnterior         = ahora;
        return EstadoVehiculo::SIN_VEHICULO;
    }

    EstadoVehiculo resultado = EstadoVehiculo::SIN_VEHICULO;

    if (_distanciaAnterior >= 0 && _tAnterior > 0) {
        float dt = (ahora - _tAnterior) / 1000.0f; // segundos
        if (dt > 0.0f) {
            float velocidad = abs(distancia - _distanciaAnterior) / dt;
            if (velocidad <= VELOCIDAD_DETENIDO_CM_S) {
                resultado = EstadoVehiculo::VEHICULO_DETENIDO;
            } else if (velocidad <= VELOCIDAD_LENTO_CM_S) {
                resultado = EstadoVehiculo::VEHICULO_LENTO;
            } else {
                resultado = EstadoVehiculo::VEHICULO_LENTO; // en rango y moviéndose
            }
        }
    } else {
        resultado = EstadoVehiculo::VEHICULO_LENTO; // primera detección
    }

    _distanciaAnterior = distancia;
    _tAnterior         = ahora;
    return resultado;
}

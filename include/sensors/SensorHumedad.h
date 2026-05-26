#pragma once
#include <Arduino.h>
#include <DHT.h>

class SensorHumedad {
public:
    SensorHumedad(uint8_t pin, uint8_t tipo = DHT22);
    void  begin();
    float leerHumedad();      // retorna % humedad relativa, o -1 si falla
    float leerTemperatura();  // retorna °C, o -1 si falla
private:
    DHT _dht;
};

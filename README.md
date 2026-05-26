# Sistema Camanchaca — Arduino

Sistema de detección de niebla costera y alerta de vehículos para vías de riesgo. Detecta condiciones de camanchaca mediante humedad y luminosidad, clasifica vehículos por velocidad con ultrasonido, y responde con una tira NeoPixel en efecto cascada con codificación cromática de riesgo.

---

## Hardware

| Componente | Modelo | Pin Arduino |
|---|---|---|
| Sensor humedad/temp | DHT11 o DHT22 | D4 |
| Fotoresistencia | LDR | A0 |
| Sensor ultrasonido | HC-SR04 | TRIG→D9, ECHO→D10 |
| Tira LED | NeoPixel (10 LEDs) | D6 |

---

## Configuración del entorno (CachyOS / Arch)

### 1. Instalar extensión PlatformIO en VS Code

```
code --install-extension platformio.platformio-ide
```

La extensión descarga automáticamente el toolchain AVR y las librerías declaradas en `platformio.ini`.

### 2. Instalar PlatformIO Core (CLI)

```bash
pip install --user --break-system-packages platformio
```

Verifica:

```bash
pio --version
# PlatformIO Core, version 6.1.19
```

### 3. Permisos para el puerto USB

```bash
sudo usermod -aG uucp $USER
```

Cierra sesión y vuelve a entrar. Sin esto el upload falla con `Permission denied` en `/dev/ttyACM0`.

### 4. Verificar que el Arduino es detectado

Con el Arduino conectado por USB:

```bash
ls /dev/ttyACM*
# /dev/ttyACM0
```

---

## Uso desde VS Code

Al abrir la carpeta del proyecto, la barra inferior de PlatformIO muestra:

| Botón | Acción |
|---|---|
| ✓ Build | Compila el proyecto |
| → Upload | Sube el firmware al Arduino |
| Monitor (enchufes) | Abre el monitor serial a 9600 baud |

La primera compilación descarga el toolchain AVR y las 3 librerías (~200 MB).

## Uso desde terminal

```bash
cd Pr-innovacion

pio run                  # compilar
pio run --target upload  # subir al Arduino
pio device monitor       # monitor serial (Ctrl+C para salir)
```

---

## Funcionamiento

El sistema evalúa el estado cada 500 ms y actualiza los LEDs en cada ciclo del `loop()`.

### Flujo de datos

```
DHT11/22 ──┐
            ├─→ DetectorNiebla ──┐
LDR ────────┘                    ├─→ NivelRiesgo → ControladorLED
                                 │
HC-SR04 ──────→ DetectorVehiculo─┘
```

### Máquina de estados

| Estado | Color LEDs | Condición de activación |
|---|---|---|
| `NORMAL` | Apagado | Sin niebla, sin vehículos anómalos |
| `NIEBLA` | Azul | Humedad ≥ umbral leve, sin vehículos |
| `ALERTA_AMARILLA` | Amarillo | Niebla activa + vehículo lento detectado |
| `ALERTA_ROJA` | Rojo | Vehículo detenido en la vía (con o sin niebla) |

La prioridad es: `ALERTA_ROJA` > `ALERTA_AMARILLA` > `NIEBLA` > `NORMAL`.

### Detección de niebla (`DetectorNiebla`)

Combina dos señales:

- **Humedad** (DHT): `NIEBLA_LEVE` si ≥ umbral leve, `NIEBLA_DENSA` si ≥ umbral denso **y** luz baja simultáneamente.
- **Luminosidad** (LDR, 0–1023): valor bajo indica visibilidad reducida.

### Detección de vehículo (`DetectorVehiculo`)

El HC-SR04 mide distancia cada ciclo. La velocidad se estima como:

```
velocidad = |distancia_actual - distancia_anterior| / dt
```

- `velocidad ≤ DETENIDO_CM_S` → `VEHICULO_DETENIDO`
- `velocidad ≤ LENTO_CM_S` → `VEHICULO_LENTO`
- Fuera de rango → `SIN_VEHICULO`

### Efecto cascada (`EfectoCascada`)

Cada 80 ms avanza un LED en la tira. El LED activo luce al 100% de brillo; los dos anteriores a 50% y 20%, generando un rastro visual que simula dirección de movimiento en la vía.

Al cambiar de estado el rastro se reinicia desde cero para evitar mezcla de colores.

---

## Estructura del proyecto

```
Pr-innovacion/
├── platformio.ini
├── src/
│   ├── main.cpp
│   ├── sensors/
│   │   ├── SensorHumedad.h/.cpp      ← DHT11/22: humedad y temperatura
│   │   ├── SensorLuz.h/.cpp          ← LDR: luminosidad raw (0–1023)
│   │   └── SensorDistancia.h/.cpp    ← HC-SR04: distancia en cm
│   ├── processing/
│   │   ├── DetectorNiebla.h/.cpp     ← humedad + luz → NivelNiebla
│   │   └── DetectorVehiculo.h/.cpp   ← distancia → EstadoVehiculo
│   ├── logic/
│   │   ├── EstadoSistema.h           ← enum Estado
│   │   └── NivelRiesgo.h/.cpp        ← máquina de estados principal
│   └── actuators/
│       ├── EfectoCascada.h/.cpp      ← animación NeoPixel con rastro
│       └── ControladorLED.h/.cpp     ← color por estado + ciclo de update
├── include/                          ← headers compartidos
├── ARQUITECTURA.md                   ← diagrama de capas detallado
└── README.md
```

---

## Monitor serial

Al correr `pio device monitor` el Arduino imprime el estado actual cada 500 ms:

```
Sistema Camanchaca iniciado.
Estado: NORMAL
Estado: NORMAL
Estado: NIEBLA
Estado: ALERTA_AMARILLA
Estado: ALERTA_ROJA
```

Velocidad: 9600 baud.

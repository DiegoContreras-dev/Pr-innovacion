# Sistema de Iluminación Vial Inteligente — Camanchaca (UCN)

**Grupo 5 "Los Camanchacas" / "BetaMentes"**  
Universidad Católica del Norte — Proyecto Diseño e Innovación Digital · Paralelo C1  
Profesor: Alejandro Paolini

---

## Contexto del proyecto

### El problema

La **camanchaca** es una niebla costera densa que afecta rutas interurbanas de la Región de Coquimbo —especialmente la **Ruta 5 Norte** entre La Serena y Coquimbo— reduciendo la visibilidad a niveles críticos. El equipo denominó este fenómeno **"ceguera técnica"**: el conductor pierde por completo las referencias visuales de la calzada y los vehículos circundantes.

**Datos clave:**
- Chile registra más de 80.000 accidentes de tránsito al año (~1.500 fallecidos)
- El 60% de las muertes ocurre en zonas rurales
- En 2025 la Región de Coquimbo registró un **aumento del 62%** en muertes por accidentes, superando los 100 fallecidos anuales

**Los 3 factores críticos identificados:**
1. **Visibilidad nula** — pérdida total de referencias visuales de la vía
2. **Infraestructura deficiente** — sin señalética luminosa ni guiado activo
3. **Imprudencia al volante** — exceso de velocidad bajo condiciones de niebla

### Pregunta de innovación

> *"¿Cómo podríamos reducir los riesgos asociados a la baja visibilidad en condiciones de niebla que afectan a los conductores y usuarios de las rutas en la Región de Coquimbo, para lograr una disminución en los accidentes de tránsito y mejorar la seguridad vial?"*

### La solución

Módulos LED autónomos instalados sobre los **guardavías** de la carretera, controlados por Arduino UNO. El sistema detecta humedad ambiental (camanchaca) y presencia/estado de vehículos, comunicando el nivel de riesgo mediante **codificación cromática**:

| Color | Significado |
|-------|-------------|
| Verde | Camanchaca activa — visibilidad reducida |
| Amarillo | Vehículo en movimiento detectado en la zona |
| Rojo | Vehículo detenido — peligro en la vía |

### Equipo

| Integrante | Carrera | Rol |
|---|---|---|
| Diego Contreras | Ing. en TI | Desarrollador Técnico (Arduino) |
| Nicolás Pérez | Ing. Civil Industrial | Coordinador de Proyecto |
| Rosario Toro | Ing. Civil Industrial | Control de Calidad y Documentación |
| Matías Olivares | Ing. Civil Industrial | Analista de Procesos |
| Emiliana Castillo | Ing. Civil Industrial | Encargada de Negocios |
| Vicente Pastén | Ing. Civil Industrial | Ayudante Técnico |

---

## Hardware

### Componentes y pines

| Componente | Descripción | Pin Arduino |
|---|---|---|
| DHT11 (módulo 3 pines) | Sensor de humedad | DATA → D2 |
| HC-SR04 | Sensor ultrasónico de distancia | TRIG → D7, ECHO → D8 |
| 3× LED verde (paralelo) | Indicador de camanchaca | D6 (470Ω c/u) |
| 3× LED amarillo (paralelo) | Vehículo en movimiento | D10 (470Ω c/u) |
| 3× LED rojo (paralelo) | Vehículo detenido | D11 (470Ω c/u) |

### Esquema de conexiones

```
Arduino UNO
│
├── D2  ──── DHT11 DATA
├── D6  ──── [470Ω] ──── LED verde (+) × 3  ──── GND
├── D7  ──── HC-SR04 TRIG
├── D8  ──── HC-SR04 ECHO
├── D10 ──── [470Ω] ──── LED amarillo (+) × 3 ── GND
├── D11 ──── [470Ω] ──── LED rojo (+) × 3 ────── GND
│
├── 5V  ──── DHT11 VCC, HC-SR04 VCC
└── GND ──── DHT11 GND, HC-SR04 GND, todos los LEDs (cátodo)
```

> **Nota DHT11:** El módulo KY-015 (3 pines) tiene el orden S – V+ – G (señal primero). No confundir con el sensor bare (4 pines).

> **Nota HC-SR04:** Requiere alimentación a **5V** obligatoriamente. El pin ECHO entrega 5V, compatible con Arduino UNO directamente.

---

## Lógica de funcionamiento

### DHT11 → LEDs verdes (independiente)

| Humedad | LEDs verdes |
|---------|-------------|
| > 80%   | ON — camanchaca detectada |
| ≤ 80%   | OFF |

### HC-SR04 → LEDs amarillo y rojo (mutuamente exclusivos)

| Condición | Amarillo | Rojo |
|-----------|----------|------|
| Nada en rango (> 150 cm o sin eco) | OFF | OFF |
| Objeto < 150 cm, en movimiento | ON | OFF |
| Objeto < 150 cm, detenido (≤ 3 cm variación en 5 lecturas seguidas) | OFF | ON |

**Detección de vehículo detenido:** el sistema acumula las últimas 5 lecturas de distancia (1 segundo a 200 ms/lectura). Si la diferencia entre la máxima y la mínima es ≤ 3 cm, el objeto se clasifica como detenido. El historial se reinicia cuando el objeto sale del rango de 150 cm.

### El verde es independiente

Los LEDs verdes pueden estar encendidos simultáneamente con amarillo o rojo.

```
Ejemplo: camanchaca + vehículo detenido → verde ON + rojo ON
```

---

## Estructura del proyecto

```
Pr-innovacion/
├── platformio.ini              ← configuración PlatformIO
├── src/
│   └── main.cpp               ← código principal (único archivo de lógica)
├── include/                   ← headers de la arquitectura por capas (referencia)
│   ├── sensors/
│   │   ├── SensorHumedad.h
│   │   └── SensorDistancia.h
│   ├── processing/
│   │   ├── DetectorNiebla.h
│   │   └── DetectorVehiculo.h
│   ├── logic/
│   │   ├── EstadoSistema.h
│   │   └── NivelRiesgo.h
│   └── actuators/
│       └── ControladorLED.h
├── README.md                  ← este archivo
└── ARQUITECTURA.md            ← diagrama de capas detallado
```

---

## Dependencias (platformio.ini)

```ini
[env:uno]
platform  = atmelavr
board     = uno
framework = arduino
monitor_speed = 9600

upload_port  = /dev/ttyUSB0   ; CH340 en Linux
monitor_port = /dev/ttyUSB0

lib_deps =
    adafruit/DHT sensor library@^1.4.6
    adafruit/Adafruit Unified Sensor@^1.1.14
```

> En Linux (CachyOS/Arch), el chip USB-serial CH340 aparece en `/dev/ttyUSB0`. Si aparece como `/dev/ttyACM0`, actualizar `upload_port` y `monitor_port` en `platformio.ini`.

---

## Configuración del entorno (CachyOS / Arch Linux)

### 1. Instalar PlatformIO

```bash
pip install --user --break-system-packages platformio
```

O instalar la extensión PlatformIO en VS Code.

### 2. Permisos de puerto USB

```bash
sudo usermod -aG uucp $USER
# Cerrar sesión y volver a entrar
```

### 3. Verificar detección del Arduino

```bash
ls /dev/ttyUSB*   # CH340 → /dev/ttyUSB0
ls /dev/ttyACM*   # ATmega16U2 → /dev/ttyACM0
```

---

## Uso

```bash
# Compilar
pio run

# Compilar y subir al Arduino
pio run --target upload

# Monitor serial (9600 baud, Ctrl+C para salir)
pio device monitor
```

---

## Monitor serial

Cada 200 ms el Arduino imprime una línea con el estado de ambos sensores:

```
=== Sistema Camanchaca UCN ===
Hum:65%  Dist:---  -> SIN VEHICULO
Hum:65%  Dist:83.4cm  -> EN MOVIMIENTO [AMARILLO]
Hum:65%  Dist:83.1cm  -> DETENIDO [ROJO]
Hum:82%  Dist:---  -> SIN VEHICULO
```

| Campo | Descripción |
|-------|-------------|
| `Hum:XX%` | Humedad relativa leída por DHT11. `ERR` si el sensor falla. |
| `Dist:XX.Xcm` | Distancia medida por HC-SR04. `---` si no hay eco (fuera de rango). |
| `-> ESTADO` | Estado actual del sistema para los LEDs amarillo/rojo. |

---

## Metas del proyecto

| Métrica | Meta |
|---|---|
| Reducción de accidentes en tramos con niebla | −20% |
| Reducción de velocidad promedio bajo activación | −15 km/h |
| Disminución de colisiones por alcance | −15% |

**Clientes objetivo:** MOP (Ministerio de Obras Públicas) y CONASET (Comisión Nacional de Seguridad de Tránsito).

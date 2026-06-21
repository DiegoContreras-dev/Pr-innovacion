# Sistema de Iluminación Vial Inteligente — Camanchaca

**Grupo 5 "BetaMentes"** · Universidad Católica del Norte  
Proyecto Diseño e Innovación Digital · Paralelo C1 · Profesor: Alejandro Paolini

---

## Índice

1. [Contexto del proyecto](#contexto-del-proyecto)
2. [Arquitectura del sistema](#arquitectura-del-sistema)
3. [Flujo de funcionamiento](#flujo-de-funcionamiento)
4. [Hardware — Componentes y conexiones](#hardware--componentes-y-conexiones)
5. [Firmware (PlatformIO / Arduino)](#firmware-platformio--arduino)
6. [Bridge Serial–WebSocket](#bridge-serialwebsocket)
7. [Dashboard Web](#dashboard-web)
8. [Instalación y lanzamiento con Docker](#instalación-y-lanzamiento-con-docker)
9. [Desarrollo local sin Docker](#desarrollo-local-sin-docker)
10. [Monitor serial](#monitor-serial)
11. [Equipo y metas](#equipo-y-metas)

---

## Contexto del proyecto

La **camanchaca** es una niebla costera densa que afecta rutas interurbanas de la Región de Coquimbo —especialmente la **Ruta 5 Norte** entre La Serena y Coquimbo— reduciendo la visibilidad a niveles críticos.

**Datos clave:**
- Chile registra más de 80.000 accidentes de tránsito al año (~1.500 fallecidos)
- En 2025 la Región de Coquimbo registró un aumento del **62%** en muertes por accidentes
- El 60% de las muertes ocurre en zonas rurales

**La solución:** módulos LED instalados sobre los guardavías, controlados por Arduino UNO. El sistema detecta humedad (camanchaca) y presencia/estado de vehículos, comunicando el nivel de riesgo mediante codificación cromática. Un dashboard web muestra el estado del sistema en tiempo real leyendo los datos directamente del Arduino por puerto serie.

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        HARDWARE                                  │
│                                                                  │
│   DHT11  ──→ D2    ┐                                            │
│   HC-SR04 ──→ D7/D8 ├── Arduino UNO ──→ USB ──→ /dev/ttyUSB0   │
│                    ┘       │                                     │
│   D6  → LED Verde          │ Serial 9600 baud                   │
│   D10 → LED Amarillo       │ "Hum:73%  Temp:22.5C  Dist:3.4cm  │
│   D11 → LED Rojo           │  -> EN MOVIMIENTO [AMARILLO]"      │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    BRIDGE  (Node.js)                             │
│                    bridge/src/index.js                           │
│                                                                  │
│  • Lee el puerto serie del Arduino (serialport v12)             │
│  • Parsea cada línea y extrae: hum, temp, dist, LEDs, riskLevel │
│  • Si no hay hardware → heartbeat "connected: false" cada 3s    │
│  • Emite JSON por WebSocket en :3001                             │
└────────────────────────────┬────────────────────────────────────┘
                             │ ws://bridge:3001
                             │ (nginx proxy /ws)
┌────────────────────────────▼────────────────────────────────────┐
│                   DASHBOARD  (React 18 + Vite)                   │
│                   dashboard/src/                                 │
│                                                                  │
│  • Recibe JSON del bridge por WebSocket                         │
│  • Muestra sensores, LEDs, historial, alertas, registros        │
│  • Sirve nginx en :3000 (Docker) o Vite dev en :5173            │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de carpetas

```
Pr-innovacion/
├── src/
│   ├── main.cpp                  ← Firmware activo (compilado por PlatformIO)
│   ├── actuators/                ← Código OOP de referencia (no compilado)
│   ├── sensors/                  ← Código OOP de referencia (no compilado)
│   ├── processing/               ← Código OOP de referencia (no compilado)
│   └── logic/                    ← Código OOP de referencia (no compilado)
├── include/                      ← Headers de las clases OOP (referencia)
│   ├── sensors/
│   ├── processing/
│   ├── logic/
│   └── actuators/
├── bridge/                       ← Bridge serial→WebSocket (Node.js)
│   ├── Dockerfile
│   ├── package.json
│   └── src/index.js
├── dashboard/                    ← Dashboard web (React + TypeScript)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── docker-compose.yml            ← Levanta bridge + dashboard
└── platformio.ini
```

> Los archivos en `src/actuators/`, `src/sensors/`, `src/processing/` y `src/logic/` junto con `include/` son una arquitectura OOP más avanzada diseñada para una versión futura del sistema (NeoPixel, detección por velocidad, dos niveles de niebla). No se compilan en el firmware actual gracias a `build_src_filter = +<main.cpp>` en `platformio.ini`.

---

## Flujo de funcionamiento

### 1. Lectura de sensores (Arduino, cada 200 ms)

```
DHT11 → dht.readHumidity() + dht.readTemperature()
           │
           ├─ hum > 80% → LED Verde ON  (camanchaca detectada)
           └─ hum ≤ 80% → LED Verde OFF

HC-SR04 → pulseIn(timeout=600µs) → distancia en cm (~10 cm máximo útil)
           │
           ├─ dist < 2 cm o dist > 5 cm → SIN VEHICULO → LEDs amarillo/rojo OFF
           │                                               reset historial 5 lecturas
           └─ 2 cm ≤ dist ≤ 5 cm → vehículo en zona → acumula últimas 5 lecturas
                               │
                               ├─ (max − min) > 1 cm → EN MOVIMIENTO → LED Amarillo ON
                               └─ (max − min) ≤ 1 cm → DETENIDO      → LED Rojo ON
```

> **Escala de prototipo:** la zona de detección (2–5 cm) simula en banco de pruebas lo que en la ruta real sería un rango de metros. El timeout de 600 µs limita físicamente el HC-SR04 a ~10 cm en este firmware.

### 2. Salida serial (9600 baud, cada 200 ms)

```
=== Sistema Camanchaca UCN ===        ← solo al arrancar
Hum:65%  Temp:22.0C  Dist:---        -> SIN VEHICULO
Hum:65%  Temp:22.0C  Dist:3.4cm     -> EN MOVIMIENTO [AMARILLO]
Hum:65%  Temp:22.1C  Dist:3.1cm     -> DETENIDO [ROJO]
Hum:82%  Temp:21.5C  Dist:---       -> SIN VEHICULO
Hum:ERR  Temp:ERR    Dist:---        -> SIN VEHICULO
```

| Campo | Descripción |
|---|---|
| `Hum:XX%` | Humedad relativa del DHT11. `ERR` si el sensor falla. |
| `Temp:XX.XC` | Temperatura en °C. `ERR` si el sensor falla. |
| `Dist:XX.Xcm` | Distancia del HC-SR04 (2–5 cm cuando hay vehículo). `---` si no hay eco. |
| `-> ESTADO` | `SIN VEHICULO` · `EN MOVIMIENTO [AMARILLO]` · `DETENIDO [ROJO]` |

### 3. Bridge (Node.js)

```
Línea serial → parseLine()
                 │
                 ├─ Regex extrae hum, temp, dist como números (null si ERR/---)
                 ├─ Lee estado LED del texto ("EN MOVIMIENTO", "DETENIDO [ROJO]")
                 ├─ Calcula ledGreen: hum !== null && hum > 80
                 ├─ Calcula riskLevel: alerta > precaucion > normal > standby
                 └─ broadcast JSON → todos los clientes WebSocket conectados
```

**JSON emitido por el bridge:**

```json
{
  "connected": true,
  "hum": 65,
  "temp": 22.0,
  "dist": 3.4,
  "ledGreen": false,
  "ledYellow": true,
  "ledRed": false,
  "riskLevel": "precaucion",
  "raw": "Hum:65%  Temp:22.0C  Dist:3.4cm  -> EN MOVIMIENTO [AMARILLO]",
  "ts": 1717800000000
}
```

Cuando no hay Arduino, el bridge emite heartbeat cada 3 s:

```json
{
  "connected": false,
  "hum": null, "temp": null, "dist": null,
  "ledGreen": false, "ledYellow": false, "ledRed": false,
  "riskLevel": "standby",
  "raw": "",
  "ts": 1717800000000
}
```

`connected: false` pausa el procesamiento de datos y alertas en el dashboard sin cerrar la conexión WebSocket.

### 4. Dashboard

```
WebSocket onmessage → bridgeMsg.current = data
                              │
requestAnimationFrame loop    │
  ├─ cada 200 ms → setUiState   → SensorCards, LEDPanel, RiskBanner
  ├─ cada 500 ms → appendLog    → SerialLog (línea raw reconstruida)
  ├─ cada 1000 ms → setHistory  → SvgChart (últimos 60 puntos)
  └─ cada 2000 ms → sensorLogs  → PaginaRegistros (tabla por sensor)

Cambio de riskLevel     → appendAlert    → AlertFeed / PaginaAlertas
Cruce de umbral hum/dist → appendSensorLog → PaginaRegistros
```

### 5. Niveles de riesgo

| `riskLevel` | Condición | Color en dashboard |
|---|---|---|
| `standby` | Sin datos / sin Arduino | Gris |
| `normal` | Camanchaca activa (hum > 80%), sin vehículo | Verde |
| `precaucion` | Vehículo en movimiento (LED amarillo ON) | Amarillo |
| `alerta` | Vehículo **detenido** en la vía (LED rojo ON) | Rojo |

---

## Hardware — Componentes y conexiones

### Lista de componentes

| Componente | Cantidad | Función |
|---|---|---|
| Arduino UNO | 1 | Microcontrolador principal (ATmega328P, 32 KB flash, 2 KB RAM) |
| DHT11 (módulo 3 pines) | 1 | Sensor de humedad y temperatura |
| HC-SR04 | 1 | Sensor ultrasónico de distancia |
| LED Verde | 3 | Indicador camanchaca activa |
| LED Amarillo | 3 | Indicador vehículo en movimiento |
| LED Rojo | 3 | Indicador vehículo detenido |
| Resistencia 220 Ω | 9 | Limitación de corriente LEDs |
| Cable USB tipo B | 1 | Alimentación y comunicación serial (CH340) |

### Diagrama de conexiones

```
Arduino UNO
│
├── D2  ─────────────── DHT11 DATA (señal)
│
├── D7  ─────────────── HC-SR04 TRIG
├── D8  ─────────────── HC-SR04 ECHO
│
├── D6  ── [220Ω] ──┬── LED Verde    (+)
│                   ├── LED Verde    (+)   × 3 en paralelo
│                   └── LED Verde    (+)
│
├── D10 ── [220Ω] ──┬── LED Amarillo (+)
│                   ├── LED Amarillo (+)   × 3 en paralelo
│                   └── LED Amarillo (+)
│
├── D11 ── [220Ω] ──┬── LED Rojo    (+)
│                   ├── LED Rojo    (+)    × 3 en paralelo
│                   └── LED Rojo    (+)
│
├── 5V  ─────────────── DHT11 VCC · HC-SR04 VCC
└── GND ─────────────── DHT11 GND · HC-SR04 GND · cátodos de todos los LEDs
```

### Tabla de pines

| Pin Arduino | Componente | Dirección |
|---|---|---|
| `D2` | DHT11 DATA | INPUT |
| `D7` | HC-SR04 TRIG | OUTPUT |
| `D8` | HC-SR04 ECHO | INPUT |
| `D6` | LEDs Verdes (×3) | OUTPUT |
| `D10` | LEDs Amarillos (×3) | OUTPUT |
| `D11` | LEDs Rojos (×3) | OUTPUT |
| `5V` | DHT11 VCC, HC-SR04 VCC | Alimentación |
| `GND` | DHT11 GND, HC-SR04 GND, cátodos LEDs | Tierra |

> **DHT11:** El módulo KY-015 de 3 pines tiene el orden S–V+–G (señal primero). No confundir con el sensor bare de 4 pines que tiene un pin NC en el medio.

> **HC-SR04:** Requiere 5V obligatoriamente. El pin ECHO entrega 5V, compatible con Arduino UNO directamente sin divisor de tensión.

---

## Firmware (PlatformIO / Arduino)

### Prerrequisitos

- [VS Code](https://code.visualstudio.com/) + extensión **PlatformIO IDE**
- O `pip install --user platformio` en terminal

### Permisos de puerto USB (Linux)

```bash
sudo usermod -aG dialout $USER   # Ubuntu/Debian/OpenSUSE
# sudo usermod -aG uucp $USER    # Arch/CachyOS

# Cerrar sesión y volver a entrar para que tome efecto
```

### Verificar detección del Arduino

```bash
ls /dev/ttyUSB*   # Chip CH340 → /dev/ttyUSB0
ls /dev/ttyACM*   # ATmega16U2 nativo → /dev/ttyACM0
```

Si aparece en `/dev/ttyACM0`, actualizar `platformio.ini`:

```ini
upload_port  = /dev/ttyACM0
monitor_port = /dev/ttyACM0
```

### Configuración `platformio.ini`

```ini
[env:uno]
platform = atmelavr
board    = uno
framework = arduino
monitor_speed = 9600

upload_port  = /dev/ttyUSB0
monitor_port = /dev/ttyUSB0
upload_flags = -V             ; omite verificación post-escritura (workaround CH340)

build_src_filter = +<main.cpp>  ; solo compila main.cpp; código OOP en subdirs queda como referencia

build_flags =
    -I include
    -Wall

lib_deps =
    adafruit/DHT sensor library@^1.4.6
    adafruit/Adafruit Unified Sensor@^1.1.14
```

> `upload_flags = -V` omite la fase de verificación de avrdude. Con algunos clones CH340 el canal serial se desincroniza durante esa fase aunque el firmware ya fue escrito correctamente. El flag evita el error sin afectar la escritura.

### Comandos PlatformIO

```bash
# Compilar
pio run

# Compilar y subir al Arduino
pio run --target upload

# Monitor serial (9600 baud — Ctrl+C para salir)
pio device monitor
```

### Arquitectura del firmware

El archivo activo es `src/main.cpp` (monolítico, ~130 líneas). En `src/` también existen subdirectorios con una arquitectura orientada a objetos más avanzada (sensores, detectores, controlador LED con NeoPixel) que están excluidos de la compilación mediante `build_src_filter`. Sirven como referencia de diseño para versiones futuras.

---

## Bridge Serial–WebSocket

El bridge (`bridge/src/index.js`) es un proceso Node.js intermediario entre el Arduino y el dashboard.

### Responsabilidades

1. **Detecta el puerto serie** — prueba en orden: `/dev/ttyUSB0`, `/dev/ttyACM0`, `/dev/ttyUSB1`, `/dev/ttyACM1`
2. **Parsea cada línea** del Arduino al formato JSON que consume el dashboard
3. **Decide el estado de conexión** — emite `arduino_connected` con la primera línea válida; `arduino_disconnected` al perder el puerto
4. **Heartbeat** — si no hay Arduino, emite `{ connected: false }` cada 3 s
5. **Reconecta automáticamente** cada 3 s si el Arduino se desconecta
6. **Broadcast JSON** por WebSocket en el puerto `3001`

### Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `SERIAL_PORTS` | `/dev/ttyUSB0,/dev/ttyACM0,/dev/ttyUSB1,/dev/ttyACM1` | Puertos a probar en orden |
| `WS_PORT` | `3001` | Puerto del servidor WebSocket |

### Dependencias Node.js

```json
{
  "serialport": "^12.0.0",
  "@serialport/parser-readline": "^12.0.0",
  "ws": "^8.18.0"
}
```

> `serialport` es un addon nativo de Node.js. El `Dockerfile` del bridge usa compilación multi-stage (python3 + make + g++) para construirlo y copia solo los binarios al runtime.

---

## Dashboard Web

Aplicación React 18 + TypeScript + Vite 5 + Tailwind CSS 3. Sirve en nginx en producción (Docker).

### Páginas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Dashboard` | Panel principal — sensores, LEDs, gráfico histórico, feed de alertas, monitor serial |
| `/alertas` | `PaginaAlertas` | Historial completo de eventos de riesgo ordenado por tiempo |
| `/registros` | `PaginaRegistros` | Lecturas por sensor: Humedad, Temperatura, Distancia |

### Componentes principales

| Componente | Función |
|---|---|
| `Header` | Reloj en tiempo real + indicador de estado de conexión |
| `RiskBanner` | Banner cromático con el nivel de riesgo actual |
| `SensorCard` | Tarjeta con valor numérico y barra de progreso para cada sensor |
| `LEDPanel` | Estado ON/OFF de los tres LEDs físicos |
| `SvgChart` | Gráfico SVG de historial de humedad y distancia (últimos 60 s) |
| `AlertFeed` | Últimas 3 alertas con link a página completa |
| `SerialLog` | Monitor serial con auto-scroll y colores por tipo |

### Estado de conexión (Header)

| Estado | Texto | Significado |
|---|---|---|
| `connecting` | `CONECTANDO…` | Intentando conectar al bridge |
| `connected` + Arduino detectado | `EN VIVO · ARDUINO` | Datos reales del hardware |
| `connected` + sin Arduino | `SIN ARDUINO` | Bridge activo, esperando USB |
| `disconnected` | `SIN BRIDGE` | Bridge no disponible (Docker caído) |

### Escalas de los sensores en dashboard

| Sensor | Rango mostrado | Umbral de alerta |
|---|---|---|
| Humedad | 0–100% | > 80% → zona camanchaca |
| Temperatura | 0–50°C | > 30°C → advertencia |
| Distancia | 0–10 cm | < 5 cm → vehículo en zona |

---

## Instalación y lanzamiento con Docker

### Prerrequisitos

- [Docker Engine](https://docs.docker.com/engine/install/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/install/) v2

### Lanzamiento

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd Pr-innovacion

# Construir imágenes y levantar servicios
docker compose up -d --build

# Abrir el dashboard
# http://localhost:3000
```

El sistema arranca siempre, con o sin Arduino conectado:

- **Sin Arduino:** el dashboard carga completo con sensores en `---`. El bridge reintenta el puerto USB cada 3 s en segundo plano.
- **Con Arduino:** en cuanto se detecta el USB, los datos aparecen automáticamente sin reiniciar Docker. El header cambia a `EN VIVO · ARDUINO`.

> El servicio `bridge` usa `privileged: true` con el volumen `/dev:/dev` para acceder a cualquier dispositivo USB conectado en caliente, sin necesidad de declarar el puerto de antemano en `docker-compose.yml`.

### Comandos útiles

```bash
# Ver logs en tiempo real (ambos servicios)
docker compose logs -f

# Ver solo el bridge (datos del Arduino)
docker compose logs -f bridge

# Detener y eliminar contenedores
docker compose down

# Reconstruir desde cero tras cambios en el código
docker compose up -d --build

# Ver estado de los servicios
docker compose ps
```

### Puertos expuestos

| Puerto | Servicio | Descripción |
|---|---|---|
| `3000` | dashboard | Dashboard web (nginx) |
| `3001` | bridge | WebSocket interno — no expuesto al host |

> El puerto `3001` no se expone al host intencionalmente. El dashboard accede al WebSocket a través del proxy nginx (`/ws → bridge:3001`), evitando CORS.

---

## Desarrollo local sin Docker

### 1. Bridge

```bash
cd bridge
npm install
node src/index.js
```

Bridge escuchando en `ws://localhost:3001`.

### 2. Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Servidor Vite en `http://localhost:5173`. El WebSocket se conecta automáticamente a `/ws` que Vite proxea a `:3001`.

### Variables de entorno opcionales (bridge)

```bash
SERIAL_PORTS=/dev/ttyACM0 WS_PORT=3001 node src/index.js
```

---

## Monitor serial

El Arduino imprime una línea cada 200 ms. Para verla directamente:

```bash
pio device monitor   # 9600 baud — Ctrl+C para salir
```

Ejemplo de salida:

```
=== Sistema Camanchaca UCN ===
Hum:65%  Temp:22.0C  Dist:---      -> SIN VEHICULO
Hum:65%  Temp:22.0C  Dist:3.4cm   -> EN MOVIMIENTO [AMARILLO]
Hum:65%  Temp:22.1C  Dist:3.1cm   -> DETENIDO [ROJO]
Hum:82%  Temp:21.5C  Dist:---     -> SIN VEHICULO
Hum:ERR  Temp:ERR    Dist:---      -> SIN VEHICULO
```

---

## Equipo y metas

### Equipo

| Integrante | Carrera | Rol |
|---|---|---|
| Diego Contreras | Ing. en TI | Desarrollador Técnico (Arduino + Dashboard) |
| Nicolás Pérez | Ing. Civil Industrial | Coordinador de Proyecto |
| Rosario Toro | Ing. Civil Industrial | Control de Calidad y Documentación |
| Matías Olivares | Ing. Civil Industrial | Analista de Procesos |
| Emiliana Castillo | Ing. Civil Industrial | Encargada de Negocios |
| Vicente Pastén | Ing. Civil Industrial | Ayudante Técnico |

### Metas

| Métrica | Objetivo |
|---|---|
| Reducción de accidentes en tramos con niebla | −20% |
| Reducción de velocidad promedio bajo activación | −15 km/h |
| Disminución de colisiones por alcance | −15% |

**Clientes objetivo:** MOP (Ministerio de Obras Públicas) y CONASET (Comisión Nacional de Seguridad de Tránsito).

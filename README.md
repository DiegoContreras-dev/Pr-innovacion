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
│   DHT11 ──→ D2 ┐                                                │
│                 ├── Arduino UNO ──→ USB ──→ /dev/ttyUSB0        │
│  HC-SR04 ──→ D7/D8 ┘     │                                      │
│                            │                                     │
│    D6  → LED Verde         │ Serial 9600 baud                   │
│    D10 → LED Amarillo      │ "Hum:73%  Dist:124.5cm  -> ..."    │
│    D11 → LED Rojo          │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    BRIDGE  (Node.js)                             │
│                    bridge/src/index.js                           │
│                                                                  │
│  • Lee el puerto serie del Arduino (serialport v12)             │
│  • Parsea cada línea y deriva: hum, dist, lux, LEDs, riskLevel  │
│  • Si no hay hardware → simulación con la misma lógica C++      │
│  • Emite JSON por WebSocket en :3001                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ ws://bridge:3001
                            │ (nginx proxy /ws)
┌───────────────────────────▼─────────────────────────────────────┐
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
├── src/                     ← Firmware C++ (PlatformIO)
│   └── main.cpp
├── include/                 ← Headers por capas (referencia)
│   ├── sensors/
│   ├── processing/
│   ├── logic/
│   └── actuators/
├── bridge/                  ← Bridge serial→WebSocket (Node.js)
│   ├── Dockerfile
│   ├── package.json
│   └── src/index.js
├── dashboard/               ← Dashboard web (React + TypeScript)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── docker-compose.yml       ← Levanta bridge + dashboard
└── platformio.ini
```

---

## Flujo de funcionamiento

### 1. Lectura de sensores (Arduino, cada 200 ms)

```
DHT11 → dht.readHumidity()
           │
           ├─ hum > 80% → LED Verde ON  (camanchaca detectada)
           └─ hum ≤ 80% → LED Verde OFF

HC-SR04 → pulseIn() → distancia en cm
           │
           ├─ dist > 150 cm o sin eco → sin vehículo → LEDs OFF + reset historial
           │
           └─ dist ≤ 150 cm → acumula últimas 5 lecturas
                               │
                               ├─ (max-min) > 3 cm → EN MOVIMIENTO → LED Amarillo ON
                               └─ (max-min) ≤ 3 cm → DETENIDO     → LED Rojo ON
```

### 2. Salida serial (9600 baud, cada 200 ms)

```
Hum:73%  Dist:124.5cm  -> EN MOVIMIENTO [AMARILLO]
Hum:85%  Dist:83.1cm   -> DETENIDO [ROJO]
Hum:60%  Dist:---      -> SIN VEHICULO
```

### 3. Bridge (Node.js)

```
Línea serial → parseLine()
                 │
                 ├─ Extrae hum, dist
                 ├─ Deriva lux = max(10, 1000 − hum × 9)
                 ├─ Lee estado LED del texto ("EN MOVIMIENTO", "DETENIDO")
                 ├─ Calcula riskLevel: standby | normal | precaucion | alerta
                 └─ broadcast JSON → todos los clientes WebSocket conectados
```

**JSON emitido por el bridge:**

```json
{
  "hum": 73,
  "dist": 124.5,
  "lux": 343,
  "ledGreen": false,
  "ledYellow": true,
  "ledRed": false,
  "riskLevel": "precaucion",
  "raw": "Hum:73%  Dist:124.5cm  -> EN MOVIMIENTO [AMARILLO]",
  "source": "hardware",
  "ts": 1717800000000
}
```

El campo `source` indica `"hardware"` cuando hay Arduino conectado, o `"simulation"` cuando el bridge está en modo de fallback.

### 4. Dashboard

```
WebSocket onmessage → bridgeMsg.current = data
                              │
requestAnimationFrame loop    │
  ├─ (cada 200 ms) → setUiState → SensorCards, LEDPanel, RiskBanner
  ├─ (cada 500 ms) → appendLog  → SerialLog (línea raw del Arduino)
  ├─ (cada 1000 ms)→ setHistory → SvgChart (últimos 60 puntos)
  └─ (cada 2000 ms)→ sensorLogs → PaginaRegistros (tabla por sensor)

Cambio de riskLevel → appendAlert → AlertFeed
Cruce de umbral hum/dist → appendSensorLog → columna Registros
```

### 5. Niveles de riesgo

| `riskLevel` | Condición | Color header |
|---|---|---|
| `standby` | Sin camanchaca, sin vehículo | Gris |
| `normal` | Camanchaca activa (hum > 80%), sin vehículo | Verde |
| `precaucion` | Vehículo en movimiento | Amarillo |
| `alerta` | Vehículo **detenido** en la vía | Rojo |

---

## Hardware — Componentes y conexiones

### Lista de componentes

| Componente | Cantidad | Función |
|---|---|---|
| Arduino UNO | 1 | Microcontrolador principal |
| DHT11 (módulo 3 pines) | 1 | Sensor de humedad ambiental |
| HC-SR04 | 1 | Sensor ultrasónico de distancia |
| LED Verde | 3 | Indicador camanchaca activa |
| LED Amarillo | 3 | Indicador vehículo en movimiento |
| LED Rojo | 3 | Indicador vehículo detenido |
| Resistencia 220 Ω | 9 | Limitación de corriente LEDs |
| Cable USB tipo B | 1 | Alimentación y comunicación serial |

### Diagrama de conexiones

```
Arduino UNO
│
├── D2  ────────────── DHT11 DATA (señal)
│
├── D7  ────────────── HC-SR04 TRIG
├── D8  ────────────── HC-SR04 ECHO
│
├── D6  ── [220Ω] ──┬─ LED Verde  (+)
│                   ├─ LED Verde  (+)  ──→ × 3 en paralelo
│                   └─ LED Verde  (+)
│
├── D10 ── [220Ω] ──┬─ LED Amarillo (+)
│                   ├─ LED Amarillo (+) ──→ × 3 en paralelo
│                   └─ LED Amarillo (+)
│
├── D11 ── [220Ω] ──┬─ LED Rojo   (+)
│                   ├─ LED Rojo   (+)  ──→ × 3 en paralelo
│                   └─ LED Rojo   (+)
│
├── 5V  ────────────── DHT11 VCC · HC-SR04 VCC
└── GND ────────────── DHT11 GND · HC-SR04 GND · todos los LEDs (−)
```

### Tabla de pines

| Pin Arduino | Componente | Tipo |
|---|---|---|
| `D2` | DHT11 DATA | INPUT |
| `D7` | HC-SR04 TRIG | OUTPUT |
| `D8` | HC-SR04 ECHO | INPUT |
| `D6` | LEDs Verdes | OUTPUT |
| `D10` | LEDs Amarillos | OUTPUT |
| `D11` | LEDs Rojos | OUTPUT |
| `5V` | DHT11 VCC, HC-SR04 VCC | Alimentación |
| `GND` | DHT11 GND, HC-SR04 GND, LEDs cátodos | Tierra |

> **DHT11:** El módulo KY-015 de 3 pines tiene el orden S – V+ – G (señal primero). No confundir con el sensor bare de 4 pines que tiene un pin NC en el medio.

> **HC-SR04:** Requiere alimentación a **5V obligatoriamente**. El pin ECHO entrega 5V, compatible con Arduino UNO directamente sin divisor de tensión.

---

## Firmware (PlatformIO / Arduino)

### Prerrequisitos

- [VS Code](https://code.visualstudio.com/) + extensión **PlatformIO IDE**
- O bien `pip install --user platformio` en terminal

### Permisos de puerto USB (Linux)

```bash
# Agregar usuario al grupo para acceder a puertos serie
sudo usermod -aG uucp $USER   # Arch/CachyOS
# sudo usermod -aG dialout $USER  # Ubuntu/Debian

# Cerrar sesión y volver a entrar para que tome efecto
```

### Verificar detección del Arduino

```bash
ls /dev/ttyUSB*   # Chip CH340 → /dev/ttyUSB0
ls /dev/ttyACM*   # ATmega16U2 → /dev/ttyACM0
```

Si el Arduino aparece en `/dev/ttyACM0`, actualizar `platformio.ini`:

```ini
upload_port  = /dev/ttyACM0
monitor_port = /dev/ttyACM0
```

### Dependencias del firmware

Declaradas en `platformio.ini`, se instalan automáticamente al compilar:

```ini
lib_deps =
    adafruit/DHT sensor library@^1.4.6
    adafruit/Adafruit Unified Sensor@^1.1.14
```

### Comandos PlatformIO

```bash
# Compilar
pio run

# Compilar y subir al Arduino
pio run --target upload

# Monitor serial (9600 baud — Ctrl+C para salir)
pio device monitor
```

---

## Bridge Serial–WebSocket

El bridge (`bridge/src/index.js`) es un proceso Node.js que actúa como intermediario entre el Arduino y el dashboard.

### Responsabilidades

1. **Detecta el puerto serie** — prueba `/dev/ttyUSB0`, `/dev/ttyACM0`, `/dev/ttyUSB1`, `/dev/ttyACM1` en orden
2. **Parsea cada línea** del Arduino al formato JSON que consume el dashboard
3. **Simula datos** con la misma lógica de `main.cpp` cuando no hay hardware conectado
4. **Reconecta** automáticamente si el Arduino se desconecta (reintento cada 5 s)
5. **Emite JSON** por WebSocket en el puerto `3001`

### Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `SERIAL_PORTS` | `/dev/ttyUSB0,/dev/ttyACM0,...` | Puertos a probar en orden |
| `WS_PORT` | `3001` | Puerto del servidor WebSocket |

### Dependencias Node.js

```json
{
  "serialport": "^12.0.0",
  "@serialport/parser-readline": "^12.0.0",
  "ws": "^8.18.0"
}
```

> `serialport` es un addon nativo de Node.js. El `Dockerfile` del bridge usa una **compilación multi-stage** (python3 + make + g++) para compilarlo y copiar solo los binarios al runtime.

---

## Dashboard Web

Aplicación React 18 + TypeScript + Vite 5 + Tailwind CSS 3.

### Páginas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Dashboard` | Panel principal — sensores, LEDs, gráfico, alertas |
| `/alertas` | `PaginaAlertas` | Historial completo de eventos de riesgo |
| `/registros` | `PaginaRegistros` | Lecturas por sensor (Humedad, Distancia, Luminosidad) |

### Estado de conexión (Header)

| Estado | Texto | Significado |
|---|---|---|
| `connecting` | `CONECTANDO…` | Intentando conectar al bridge |
| `connected` + `hardware` | `EN VIVO · ARDUINO` | Bridge activo con Arduino real |
| `connected` + `simulation` | `EN VIVO · SIM` | Bridge activo en modo simulación |
| `disconnected` | `SIMULACIÓN` | Bridge no disponible |

---

## Instalación y lanzamiento con Docker

### Prerrequisitos

- [Docker Engine](https://docs.docker.com/engine/install/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/install/) v2

### Modo simulación (sin Arduino)

No se necesita hardware. El bridge detecta que no hay puerto serie y activa la simulación automáticamente.

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd Pr-innovacion

# Construir imágenes y levantar servicios
docker compose up -d

# Abrir el dashboard
# http://localhost:3000
```

El header del dashboard mostrará `EN VIVO · SIM` mientras no haya Arduino conectado.

### Modo hardware (con Arduino conectado)

1. Subir el firmware al Arduino:
   ```bash
   pio run --target upload
   ```

2. Identificar el puerto:
   ```bash
   ls /dev/ttyUSB* /dev/ttyACM*
   ```

3. Editar `docker-compose.yml` y descomentar la sección `devices` del servicio `bridge`:
   ```yaml
   bridge:
     devices:
       - /dev/ttyUSB0:/dev/ttyUSB0   # ajustar según tu puerto
   ```

4. (Si el contenedor no tiene permisos sobre el puerto) descomentar también:
   ```yaml
   bridge:
     group_add: ["dialout"]   # Ubuntu/Debian
   # group_add: ["uucp"]      # Arch/CachyOS
   ```

5. Levantar:
   ```bash
   docker compose up -d
   ```

El header del dashboard cambiará a `EN VIVO · ARDUINO` cuando el bridge detecte el Arduino.

### Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver solo el bridge
docker compose logs -f bridge

# Detener y eliminar contenedores
docker compose down

# Reconstruir imágenes desde cero (tras cambios en el código)
docker compose up -d --build

# Ver estado de los servicios
docker compose ps
```

### Puertos expuestos

| Puerto | Servicio | Descripción |
|---|---|---|
| `3000` | dashboard | Dashboard web (nginx) |
| `3001` | bridge | WebSocket interno (solo accesible desde el contenedor dashboard) |

> El puerto `3001` del bridge **no se expone al host** intencionalmente. El dashboard accede al WebSocket a través del proxy nginx `/ws → bridge:3001`.

---

## Desarrollo local sin Docker

### 1. Bridge

```bash
cd bridge
npm install
node src/index.js
```

El bridge quedará escuchando en `ws://localhost:3001`.

### 2. Dashboard

```bash
cd dashboard
npm install
npm run dev
```

El servidor Vite quedará en `http://localhost:5173` y hará proxy automático de `/ws` al bridge en `:3001`.

### Variables de entorno opcionales (bridge)

```bash
SERIAL_PORTS=/dev/ttyACM0 WS_PORT=3001 node src/index.js
```

---

## Monitor serial

Cada 200 ms el Arduino imprime una línea:

```
=== Sistema Camanchaca UCN ===
Hum:65%  Dist:---      -> SIN VEHICULO
Hum:65%  Dist:83.4cm   -> EN MOVIMIENTO [AMARILLO]
Hum:65%  Dist:83.1cm   -> DETENIDO [ROJO]
Hum:82%  Dist:---      -> SIN VEHICULO
Hum:82%  Dist:91.2cm   -> EN MOVIMIENTO [AMARILLO]
Hum:ERR  Dist:---      -> SIN VEHICULO
```

| Campo | Descripción |
|---|---|
| `Hum:XX%` | Humedad relativa del DHT11. `ERR` si el sensor falla. |
| `Dist:XX.Xcm` | Distancia del HC-SR04. `---` si no hay eco (fuera de rango). |
| `-> ESTADO` | Estado actual: `SIN VEHICULO`, `EN MOVIMIENTO [AMARILLO]`, `DETENIDO [ROJO]` |

Ver en PlatformIO:
```bash
pio device monitor   # 9600 baud — Ctrl+C para salir
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

# Arquitectura por Capas — Sistema Camanchaca (Arduino)

## Diagrama general

```
┌─────────────────────────────────────────────────────┐
│           CAPA 4 — ACTUACIÓN VISUAL                 │
│   ControladorLED: PWM, cascada, colores RGB         │
├─────────────────────────────────────────────────────┤
│           CAPA 3 — LÓGICA DE NEGOCIO                │
│   MáquinaEstados: NORMAL / NIEBLA / ALERTA          │
│   NivelRiesgo: azul → amarillo → rojo               │
├─────────────────────────────────────────────────────┤
│           CAPA 2 — PROCESAMIENTO                    │
│   DetectorNiebla: humedad + LDR → condición         │
│   DetectorVehiculo: ultrasónico → presencia/velocidad│
├─────────────────────────────────────────────────────┤
│           CAPA 1 — SENSORES (HAL)                   │
│   SensorHumedad | SensorLuz | SensorDistancia       │
└─────────────────────────────────────────────────────┘
```

## Estructura de archivos

```
Pr-innovacion/
├── platformio.ini          ← config PlatformIO (board: uno, libs)
├── src/
│   ├── main.cpp            ← entry point: setup() y loop()
│   ├── sensors/
│   │   ├── SensorHumedad.h/.cpp
│   │   ├── SensorLuz.h/.cpp
│   │   └── SensorDistancia.h/.cpp
│   ├── processing/
│   │   ├── DetectorNiebla.h/.cpp
│   │   └── DetectorVehiculo.h/.cpp
│   ├── logic/
│   │   ├── EstadoSistema.h         ← enum Estado
│   │   └── NivelRiesgo.h/.cpp      ← máquina de estados
│   └── actuators/
│       ├── EfectoCascada.h/.cpp
│       └── ControladorLED.h/.cpp
├── Documentacion Previa/
│   └── Contexto_Completo_Proyecto.md
└── ARQUITECTURA.md
```

## Flujo de datos

```
Sensores → Procesamiento → Lógica → Actuación
  LDR       DetectorNiebla   Estado   PWM + color
  DHT    →  (umbral niebla)  →  azul/amarillo/rojo
  HC-SR04   DetectorVehiculo  →  cascada secuencial
```

## Descripción de capas

### Capa 1 — Sensores (HAL)
Abstracción del hardware físico. Cada módulo expone una interfaz simple para leer datos crudos del sensor correspondiente.

| Módulo | Sensor | Dato que entrega |
|---|---|---|
| `SensorHumedad` | DHT11 / DHT22 | Humedad relativa (%) y temperatura |
| `SensorLuz` | LDR (fotoresistencia) | Nivel de luminosidad (0–1023) |
| `SensorDistancia` | HC-SR04 (ultrasónico) | Distancia al objeto más cercano (cm) |

### Capa 2 — Procesamiento
Interpreta los datos crudos de los sensores y genera condiciones significativas para la lógica.

| Módulo | Entrada | Salida |
|---|---|---|
| `DetectorNiebla` | Humedad + Luminosidad | `bool nieblaActiva`, nivel de densidad |
| `DetectorVehiculo` | Distancia | `bool vehiculoPresente`, velocidad estimada |

### Capa 3 — Lógica de negocio
Máquina de estados que determina el estado global del sistema y el nivel de riesgo a comunicar.

**Estados:**
- `NORMAL` → sin niebla, sin vehículos anómalos
- `NIEBLA` → camanchaca activa, guía visual azul
- `ALERTA_AMARILLA` → vehículo cercano a baja velocidad
- `ALERTA_ROJA` → obstáculo / vehículo detenido en la vía

**Codificación cromática:**
| Color | Estado | Significado |
|---|---|---|
| 🔵 Azul | `NIEBLA` | Guía estándar, seguir con precaución |
| 🟡 Amarillo | `ALERTA_AMARILLA` | Vehículo lento adelante |
| 🔴 Rojo | `ALERTA_ROJA` | Obstáculo detenido en la vía |

### Capa 4 — Actuación visual
Controla físicamente los LEDs según las órdenes de la capa de lógica.

| Módulo | Responsabilidad |
|---|---|
| `ControladorLED` | Setear color RGB y regular intensidad por PWM |
| `EfectoCascada` | Encendido secuencial de módulos para indicar dirección de la vía |

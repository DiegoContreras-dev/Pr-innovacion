# Sistema Camanchaca — Arduino

**Sistema de Iluminación Vial Inteligente de Guiado Activo**
Grupo 5 "Los Camanchacas" / "BetaMentes" — Universidad Católica del Norte
Asignatura: Proyecto Diseño e Innovación Digital · Paralelo C1 · Profesor: Alejandro Paolini

---

## Contexto del proyecto

### El problema

La **camanchaca** es una niebla costera densa que afecta rutas interurbanas de la Región de Coquimbo —especialmente la **Ruta 5 Norte** entre La Serena y Coquimbo— reduciendo la visibilidad a niveles críticos. El equipo denominó este fenómeno **"ceguera técnica"**: el conductor pierde por completo las referencias visuales de la calzada y los vehículos circundantes.

**Datos clave:**
- Chile registra más de 80.000 accidentes de tránsito al año (~1.500 fallecidos, ~4 por día)
- El 60 % de las muertes ocurre en zonas rurales
- En 2025 la Región de Coquimbo registró un **aumento del 62 %** en muertes por accidentes, superando los 100 fallecidos anuales
- Los siniestros viales representan entre el 2 % y 3 % del PIB nacional

**Los 3 factores críticos identificados (por orden de peligrosidad):**
1. **Visibilidad nula** — pérdida total de referencias visuales de la vía y otros vehículos
2. **Infraestructura deficiente** — sin señalética luminosa ni tecnología de guiado activo
3. **Imprudencia al volante** — exceso de velocidad, camiones sin luces reglamentarias

### Pregunta de innovación

> *"¿Cómo podríamos reducir los riesgos asociados a la baja visibilidad en condiciones de niebla que afectan a los conductores y usuarios de las rutas en la Región de Coquimbo, para lograr una disminución en los accidentes de tránsito y mejorar la seguridad vial?"*

### La solución

Módulos LED autónomos instalados directamente sobre los **guardavías (barreras de contención)** de la carretera, alimentados por panel solar y batería, controlados por Arduino. El sistema se activa automáticamente al detectar condiciones de niebla sin intervención humana, guía al conductor mediante **efecto cascada** que señala la dirección de la vía, y comunica el nivel de riesgo mediante **codificación cromática**.

Instalación **no invasiva**: se monta sobre infraestructura existente sin intervención mayor en la calzada.

### Cliente objetivo

**MOP** (Ministerio de Obras Públicas) + **CONASET** (Comisión Nacional de Seguridad de Tránsito)
Representado por Alberto Escobar Poblete (Sec. Ejecutivo CONASET) y Joaquín Daga Kunze (Director General MOP).

### Metas a 1 año

| Métrica | Meta |
|---|---|
| Reducción de accidentes en tramos con niebla | −20 % |
| Reducción de velocidad promedio bajo activación | −15 km/h |
| Disminución de colisiones por alcance | −15 % |

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

# Contexto Completo del Proyecto — Sistema de Iluminación Vial Inteligente

**Grupo 5 — "Los Camanchacas" / "BetaMentes"**
Asignatura: Proyecto Diseño e Innovación Digital — UCN, Paralelo C1
Profesor: Alejandro Paolini | Fecha de inicio: Marzo 2026

---

## Equipo

| Integrante | Carrera | Rol |
|---|---|---|
| Diego Contreras | Ing. en TI | Desarrollador Técnico (Arduino) |
| Nicolás Pérez | Ing. Civil Industrial | Coordinador de Proyecto |
| Rosario Toro | Ing. Civil Industrial | Control de Calidad y Documentación |
| Matías Olivares | Ing. Civil Industrial | Analista de Procesos |
| Emiliana Castillo | Ing. Civil Industrial | Encargada de Negocios |
| Vicente Pastén | Ing. Civil Industrial | Ayudante Técnico |

---

## Pregunta Problemática

> "¿Cómo podríamos reducir los riesgos asociados a la baja visibilidad en condiciones de niebla que afectan a los conductores y usuarios de las rutas en la Región de Coquimbo, para lograr una disminución en los accidentes de tránsito y mejorar la seguridad vial?"

---

## El Problema: La Camanchaca

La camanchaca es una niebla costera densa que afecta principalmente la **Ruta 5 Norte** en zonas de La Serena y Coquimbo. Genera lo que el equipo llama **"ceguera técnica"** en los conductores.

**Datos clave:**
- Chile registra más de 80.000 accidentes de tránsito al año (~1.500 fallecidos, ~4 por día)
- El 60% de las muertes ocurre en zonas rurales
- En 2025, la Región de Coquimbo tuvo un **aumento del 62% en muertes** por accidentes, superando los 100 fallecidos
- Los siniestros viales representan entre el 2% y 3% del PIB nacional

**Los 3 factores críticos identificados (ordenados por peligrosidad):**
1. **Visibilidad nula** — el conductor pierde referencias visuales de la ruta y otros vehículos
2. **Infraestructura deficiente** — sin señalética luminosa ni tecnología de guiado activo
3. **Imprudencia al volante** — exceso de velocidad, camiones sin luces reglamentarias

---

## Cliente Ideal

**MOP** (Ministerio de Obras Públicas) + **CONASET** (Comisión Nacional de Seguridad de Tránsito)

Representado por dos arquetipos reales:
- **Alberto Escobar Poblete** — Secretario Ejecutivo CONASET
- **Joaquín Daga Kunze** — Director General de Obras Públicas

Por qué son el cliente ideal:
- Tienen fondos gubernamentales (máximo poder adquisitivo)
- Viven bajo presión social constante por reducir cifras de accidentes
- Buscan soluciones tecnológicas escalables a nivel nacional
- Son los responsables legales de la infraestructura vial segura

---

## Proceso de Ideación

Se generaron **60 ideas** entre los 6 integrantes. Las principales categorías fueron: iluminación inteligente, monitoreo IoT, marcadores de pavimento, láseres guía, sistemas vehiculares, y restricciones regulatorias.

**Matriz de Priorización** (criterios: Factibilidad 30%, Desempeño 25%, Cobertura 25%, Complejidad Técnica 20%):

| Idea | Puntaje |
|---|---|
| 1. Iluminación Inteligente | **6.0 ✅ GANADORA** |
| 2. Monitoreo IoT y App | 4.75 |
| 3. Marcadores de Pavimento Dinámicos | 4.25 |
| 4. Láseres Guía | 3.5 |
| 5. Tachas Solares con Sensor de Proximidad | 3.5 |

---

## La Solución: Sistema de Iluminación Vial Inteligente de Guiado Activo

**¿Qué es?** Módulos LED autónomos instalados en los **guardavías de la carretera**, que se activan automáticamente cuando detectan condiciones de niebla.

**Componentes principales:**
- **Hardware:** Microcontroladores Arduino + módulos LED
- **Energía:** Paneles solares + baterías (100% autónomo, sin red eléctrica)
- **Sensores:** De humedad y ambientales para detectar la camanchaca
- **Lógica dinámica:** Ajusta intensidad lumínica según condiciones climáticas
- **Comunicación cromática:** Distintos colores según nivel de riesgo en tiempo real
- **Efecto cascada:** Las luces se encienden en secuencia marcando la dirección de las curvas

**Instalación:** No invasiva, se monta directamente sobre la infraestructura existente (guardavías).

---

## Método SCAMPER Aplicado

| Letra | Aplicación |
|---|---|
| **Sustituir** | Red eléctrica → paneles solares + baterías |
| **Combinar** | Iluminación + sensores de velocidad (prevención activa) |
| **Adaptar** | Hardware montable en guardavías (no invasivo) |
| **Modificar** | Arduino ajusta intensidad según clima |
| **Proponer** | Uso secundario en pistas de aterrizaje |
| **Eliminar** | Nada eliminado |
| **Reordenar** | Efecto cascada en vez de luces fijas simultáneas |

---

## Entrevistas Realizadas

Se diseñó un guión estructurado con 4 bloques de preguntas validando los 3 problemas principales y la solución propuesta. La síntesis esperada de los entrevistados:

> *"Un sistema automatizado de luces LED incrustadas en la pista sí ayudaría enormemente a manejar seguro, ya que marcaría el camino sin depender de la propia visión en la niebla."*

---

## Metas a 1 Año

- Reducción de accidentes en tramos con niebla: **-20%**
- Reducción de velocidad promedio bajo activación del sistema: **-15 km/h**
- Disminución de colisiones por alcance: **-15%**

---

## Retrospectiva del Equipo

| Categoría | Detalle |
|---|---|
| ✅ Lo que salió bien | Entrevistas útiles, roles claros, informe de calidad |
| ⚠️ Lo mejorable | Comunicación grupal y cumplimiento de plazos |
| 📚 Aprendizaje | Cómo perspectivas reales se aplican al tránsito |
| 🚀 Acción correctiva | Fechas límite internas previas a las entregas |
| ▶️ Comenzar | Reuniones semanales de coordinación |
| ⏹️ Dejar de hacer | Esperar que el profesor exija los avances |
| 🔁 Seguir haciendo | Respetar roles y mantener buen clima laboral |

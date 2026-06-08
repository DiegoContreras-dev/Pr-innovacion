import { useState, useRef, useEffect, useCallback } from 'react'
import { ArduinoLogic } from '../logic/arduinoLogic'
import type {
  UIState, LogEntry, AlertEntry, HistoryBuffer, RiskLevel, SceneName,
  SensorLogEntry, SensorKey,
} from '../types'

const HIST_LEN = 60

const PHASES = [
  { name: 'DESPEJADO',   hum: 55, dist: 350, dur: 5000 },
  { name: 'NIEBLA',      hum: 88, dist: 350, dur: 6000 },
  { name: 'VEHICULO',    hum: 88, dist: 90,  dur: 5000 },
  { name: 'DETENIDO',    hum: 88, dist: 105, dur: 5000 },
  { name: 'DESPEJADO 2', hum: 62, dist: 350, dur: 4000 },
]

const ALERT_MESSAGES: Record<RiskLevel, string> = {
  standby:    'Sistema en standby — Sin condiciones críticas',
  normal:     'Camanchaca detectada — LEDs verdes de guiado activos',
  precaucion: 'Vehículo en movimiento — LEDs amarillos activos',
  alerta:     'Vehículo DETENIDO en la vía — LEDs rojos activos',
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function nowTime() {
  return new Date().toLocaleTimeString('es-CL', { hour12: false })
}

interface SimRef {
  hum: number; dist: number; temp: number; lux: number
  autoMode: boolean
  phaseIdx: number; phaseTimer: number
  lastTs: number; uiTimer: number; serialTimer: number; histTimer: number; sensorTimer: number
  humHistory: HistoryBuffer; distHistory: HistoryBuffer; histPtr: number
  logId: number; alertId: number; sensorLogId: number
  prevRiskLevel: RiskLevel
  prevHumZone: 'normal' | 'fog'   // bajo/sobre 80%
  prevDistZone: 'fuera' | 'dentro'  // fuera/dentro de 150cm
}

export function useSimulation() {
  const logic = useRef(new ArduinoLogic())

  const sim = useRef<SimRef>({
    hum: 65, dist: 200, temp: 18, lux: 320,
    autoMode: true,
    phaseIdx: 0, phaseTimer: 0,
    lastTs: 0, uiTimer: 0, serialTimer: 0, histTimer: 0, sensorTimer: 0,
    humHistory:  new Array(HIST_LEN).fill(null),
    distHistory: new Array(HIST_LEN).fill(null),
    histPtr: 0,
    logId: 3, alertId: 0, sensorLogId: 0,
    prevRiskLevel: 'standby',
    prevHumZone: 'normal',
    prevDistZone: 'fuera',
  })

  const [uiState, setUiState] = useState<UIState>({
    sensors:   { hum: 65, dist: 200, temp: 18, lux: 320 },
    leds:      { green: false, yellow: false, red: false },
    riskLevel: 'standby',
    autoMode:  true,
  })

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 0, time: nowTime(), msg: '=== Sistema Camanchaca UCN ===', type: 'normal' },
    { id: 1, time: nowTime(), msg: 'DHT11 iniciado. HC-SR04 listo. LEDs configurados.', type: 'normal' },
    { id: 2, time: nowTime(), msg: 'Iniciando simulación automática…', type: 'normal' },
  ])

  const [alerts, setAlerts] = useState<AlertEntry[]>([])

  const [sensorLogs, setSensorLogs] = useState<SensorLogEntry[]>([
    { id: 0, time: nowTime(), sensor: 'hum',  value: '65%',    event: 'Sensor DHT11 inicializado',    type: 'normal' },
    { id: 1, time: nowTime(), sensor: 'dist', value: '---',    event: 'Sensor HC-SR04 inicializado',  type: 'normal' },
    { id: 2, time: nowTime(), sensor: 'temp', value: '18.0°C', event: 'Temperatura inicial detectada', type: 'normal' },
    { id: 3, time: nowTime(), sensor: 'lux',  value: '320lx',  event: 'LDR inicializado',              type: 'normal' },
  ])

  const [history, setHistory] = useState<{ hum: HistoryBuffer; dist: HistoryBuffer }>({
    hum:  new Array(HIST_LEN).fill(null),
    dist: new Array(HIST_LEN).fill(null),
  })

  const appendLog = useCallback((msg: string, type: LogEntry['type'] = 'normal') => {
    setLogs(prev => {
      const entry: LogEntry = { id: sim.current.logId++, time: nowTime(), msg, type }
      const next = [...prev, entry]
      return next.length > 150 ? next.slice(-150) : next
    })
  }, [])

  const appendSensorLog = useCallback((sensor: SensorKey, value: string, event: string, type: SensorLogEntry['type'] = 'normal') => {
    setSensorLogs(prev => {
      const entry: SensorLogEntry = { id: sim.current.sensorLogId++, time: nowTime(), sensor, value, event, type }
      const next = [...prev, entry]
      return next.length > 200 ? next.slice(-200) : next
    })
  }, [])

  const appendAlert = useCallback((level: RiskLevel, message: string) => {
    setAlerts(prev => {
      const entry: AlertEntry = { id: sim.current.alertId++, time: nowTime(), level, message }
      const next = [entry, ...prev]
      return next.length > 30 ? next.slice(0, 30) : next
    })
  }, [])

  useEffect(() => {
    let rafId: number
    const s = sim.current
    const l = logic.current

    const loop = (ts: number) => {
      if (s.lastTs === 0) { s.lastTs = ts; rafId = requestAnimationFrame(loop); return }
      const dt = Math.min(ts - s.lastTs, 100)
      s.lastTs = ts

      // Auto-phase interpolation
      if (s.autoMode) {
        s.phaseTimer += dt
        const ph = PHASES[s.phaseIdx % PHASES.length]
        s.hum  = lerp(s.hum,  ph.hum,  0.04)
        s.dist = lerp(s.dist, ph.dist, 0.04)
        s.temp = lerp(s.temp, 14 + Math.sin(ts * 0.00008) * 5, 0.01)
        s.lux  = lerp(s.lux,  s.hum > 80 ? 35 : 420, 0.03)
        if (s.phaseTimer >= ph.dur) {
          s.phaseTimer = 0
          s.phaseIdx++
          appendLog(`=== Fase: ${PHASES[s.phaseIdx % PHASES.length].name} ===`)
        }
      }

      // Arduino logic mirror
      const r          = l.run(s.hum, s.dist)
      const riskLevel: RiskLevel =
        r.ledRed    ? 'alerta'     :
        r.ledYellow ? 'precaucion' :
        r.ledGreen  ? 'normal'     : 'standby'

      // Alerta cuando cambia el nivel de riesgo
      if (riskLevel !== s.prevRiskLevel) {
        s.prevRiskLevel = riskLevel
        appendAlert(riskLevel, ALERT_MESSAGES[riskLevel])
      }

      // Logs por sensor (cruces de umbral)
      const humZone: 'fog' | 'normal' = s.hum > 80 ? 'fog' : 'normal'
      if (humZone !== s.prevHumZone) {
        s.prevHumZone = humZone
        if (humZone === 'fog') appendSensorLog('hum', `${s.hum.toFixed(0)}%`, 'Umbral niebla superado (>80%) — LEDs verdes ON', 'warn')
        else                   appendSensorLog('hum', `${s.hum.toFixed(0)}%`, 'Humedad bajo umbral (<80%) — LEDs verdes OFF', 'normal')
      }
      const distZone: 'dentro' | 'fuera' = s.dist > 0 && s.dist < 150 ? 'dentro' : 'fuera'
      if (distZone !== s.prevDistZone) {
        s.prevDistZone = distZone
        if (distZone === 'dentro') appendSensorLog('dist', `${s.dist.toFixed(0)}cm`, 'Vehículo entró a zona de detección (<150cm)', 'warn')
        else                       appendSensorLog('dist', `${s.dist.toFixed(0)}cm`, 'Vehículo fuera de zona de detección', 'normal')
      }

      // Lecturas periódicas por sensor cada 2s
      s.sensorTimer += dt
      if (s.sensorTimer >= 2000) {
        s.sensorTimer = 0
        const humType: SensorLogEntry['type'] = s.hum > 80 ? 'warn' : 'normal'
        const distType: SensorLogEntry['type'] = r.ledRed ? 'err' : r.ledYellow ? 'warn' : 'normal'
        appendSensorLog('hum',  `${s.hum.toFixed(0)}%`,    `Lectura DHT11 — Humedad ambiental`, humType)
        appendSensorLog('dist', s.dist > 0 ? `${s.dist.toFixed(1)}cm` : '---', r.ledRed ? 'HC-SR04 — Vehículo DETENIDO' : r.ledYellow ? 'HC-SR04 — Vehículo en movimiento' : 'HC-SR04 — Sin vehículo en zona', distType)
        appendSensorLog('temp', `${s.temp.toFixed(1)}°C`, `Lectura DHT11 — Temperatura ambiente`, 'normal')
        appendSensorLog('lux',  `${s.lux.toFixed(0)}lx`,  s.lux < 100 ? 'LDR — Baja luminosidad (niebla/noche)' : 'LDR — Luminosidad normal', s.lux < 100 ? 'warn' : 'normal')
      }

      // UI state (throttled to 200ms)
      s.uiTimer += dt
      if (s.uiTimer >= 200) {
        s.uiTimer = 0
        setUiState({
          sensors:   { hum: s.hum, dist: s.dist, temp: s.temp, lux: s.lux },
          leds:      { green: r.ledGreen, yellow: r.ledYellow, red: r.ledRed },
          riskLevel,
          autoMode:  s.autoMode,
        })
      }

      // Serial log (500ms)
      s.serialTimer += dt
      if (s.serialTimer >= 500) {
        s.serialTimer = 0
        const humStr  = `Hum:${s.hum.toFixed(0)}%`
        const distStr = s.dist > 0 ? `Dist:${s.dist.toFixed(1)}cm` : 'Dist:---'
        const stStr   =
          r.ledRed    ? '-> DETENIDO [ROJO]'          :
          r.ledYellow ? '-> EN MOVIMIENTO [AMARILLO]'  : '-> SIN VEHICULO'
        const type: LogEntry['type'] = r.ledRed ? 'err' : r.ledYellow ? 'warn' : 'normal'
        appendLog(`${humStr}  ${distStr}  ${stStr}`, type)
      }

      // History (1s)
      s.histTimer += dt
      if (s.histTimer >= 1000) {
        s.histTimer = 0
        s.humHistory[s.histPtr]  = s.hum
        s.distHistory[s.histPtr] = s.dist
        s.histPtr = (s.histPtr + 1) % HIST_LEN
        setHistory({ hum: [...s.humHistory], dist: [...s.distHistory] })
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [appendLog, appendAlert, appendSensorLog])

  const setScene = useCallback((scene: SceneName) => {
    const s = sim.current
    s.autoMode = false
    const presets: Record<SceneName, { hum: number; dist: number }> = {
      niebla:     { hum: 92, dist: 380 },
      vehiculo:   { hum: 88, dist: 90  },
      emergencia: { hum: 95, dist: 105 },
      despejado:  { hum: 52, dist: 380 },
    }
    const p = presets[scene]
    s.hum  = p.hum
    s.dist = p.dist
    if (scene === 'emergencia') logic.current.forceReading(105)
    else logic.current.resetDistHist()
    appendLog(`>>> Escena: ${scene.toUpperCase()}`)
    setUiState(prev => ({ ...prev, autoMode: false }))
  }, [appendLog])

  const toggleAuto = useCallback(() => {
    const s = sim.current
    s.autoMode = !s.autoMode
    if (s.autoMode) { s.phaseIdx = 0; s.phaseTimer = 0 }
    appendLog(`>>> Modo ${s.autoMode ? 'AUTOMÁTICO' : 'MANUAL'} activado`)
    setUiState(prev => ({ ...prev, autoMode: s.autoMode }))
  }, [appendLog])

  const setSliders = useCallback((hum: number, dist: number) => {
    if (!sim.current.autoMode) {
      sim.current.hum  = hum
      sim.current.dist = dist
    }
  }, [])

  return { uiState, logs, alerts, sensorLogs, history, setScene, toggleAuto, setSliders }
}

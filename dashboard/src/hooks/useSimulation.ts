import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  UIState, LogEntry, AlertEntry, HistoryBuffer, RiskLevel,
  SensorLogEntry, SensorKey, BridgeMessage, ConnectionStatus,
} from '../types'

const HIST_LEN = 60

const UMBRAL_HUM      = 80   // % — debe coincidir con firmware UMBRAL_HUM_CAMANCHACA y bridge UMBRAL_HUM
const UMBRAL_DIST_MIN = 2    // cm — debe coincidir con firmware UMBRAL_DIST_MIN_CM
const UMBRAL_DIST_MAX = 18   // cm — debe coincidir con firmware UMBRAL_DIST_MAX_CM

const ALERT_MESSAGES: Record<RiskLevel, string> = {
  standby:    'Sistema en standby — Sin condiciones críticas',
  normal:     'Camanchaca detectada — LEDs verdes de guiado activos',
  precaucion: 'Vehículo en movimiento — LEDs amarillos activos',
  alerta:     'Vehículo DETENIDO en la vía — LEDs rojos activos',
}

function nowTime() {
  return new Date().toLocaleTimeString('es-CL', { hour12: false })
}

interface TrackRef {
  hum: number; temp: number; dist: number
  lastTs: number; uiTimer: number; serialTimer: number; histTimer: number; sensorTimer: number
  humHistory: HistoryBuffer; distHistory: HistoryBuffer; histPtr: number
  logId: number; alertId: number; sensorLogId: number
  prevRiskLevel: RiskLevel
  prevHumZone:  'normal' | 'fog'
  prevDistZone: 'fuera' | 'dentro'
  ledGreen: boolean; ledYellow: boolean; ledRed: boolean
}

export function useSimulation() {
  const track = useRef<TrackRef>({
    hum: 0, temp: 0, dist: 0,
    lastTs: 0, uiTimer: 0, serialTimer: 0, histTimer: 0, sensorTimer: 0,
    humHistory:  new Array(HIST_LEN).fill(null),
    distHistory: new Array(HIST_LEN).fill(null),
    histPtr: 0,
    logId: 2, alertId: 0, sensorLogId: 0,
    prevRiskLevel: 'standby',
    prevHumZone: 'normal',
    prevDistZone: 'fuera',
    ledGreen: false, ledYellow: false, ledRed: false,
  })

  // ── WebSocket bridge ─────────────────────────────────────────────────────────
  const bridgeMsg          = useRef<BridgeMessage | null>(null)
  const wsRef              = useRef<WebSocket | null>(null)
  const reconnTimer        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevArduinoConn    = useRef<boolean | null>(null)

  const [wsStatus,  setWsStatus]  = useState<ConnectionStatus>('connecting')
  const [wsHasData, setWsHasData] = useState(false)

  // ── Estado UI ────────────────────────────────────────────────────────────────
  const [uiState, setUiState] = useState<UIState>({
    sensors:   { hum: 0, dist: 0, temp: 0 },
    leds:      { green: false, yellow: false, red: false },
    riskLevel: 'standby',
  })

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 0, time: nowTime(), msg: '=== Sistema Camanchaca UCN ===', type: 'normal' },
    { id: 1, time: nowTime(), msg: 'Conectando al bridge serial…',  type: 'normal' },
  ])

  const [alerts,     setAlerts]     = useState<AlertEntry[]>([])
  const [sensorLogs, setSensorLogs] = useState<SensorLogEntry[]>([])
  const [history,    setHistory]    = useState<{ hum: HistoryBuffer; dist: HistoryBuffer }>({
    hum:  new Array(HIST_LEN).fill(null),
    dist: new Array(HIST_LEN).fill(null),
  })

  // ── Helpers de log ───────────────────────────────────────────────────────────
  const appendLog = useCallback((msg: string, type: LogEntry['type'] = 'normal') => {
    setLogs(prev => {
      const entry: LogEntry = { id: track.current.logId++, time: nowTime(), msg, type }
      const next = [...prev, entry]
      return next.length > 500 ? next.slice(-500) : next
    })
  }, [])

  const appendSensorLog = useCallback((sensor: SensorKey, value: string, event: string, type: SensorLogEntry['type'] = 'normal') => {
    setSensorLogs(prev => {
      const entry: SensorLogEntry = { id: track.current.sensorLogId++, time: nowTime(), sensor, value, event, type }
      const next = [...prev, entry]
      return next.length > 200 ? next.slice(-200) : next
    })
  }, [])

  const appendAlert = useCallback((level: RiskLevel, message: string) => {
    setAlerts(prev => {
      const entry: AlertEntry = { id: track.current.alertId++, time: nowTime(), level, message }
      const next = [entry, ...prev]
      return next.length > 30 ? next.slice(0, 30) : next
    })
  }, [])

  // ── Conexión WebSocket ───────────────────────────────────────────────────────
  useEffect(() => {
    function connect() {
      if (reconnTimer.current) { clearTimeout(reconnTimer.current); reconnTimer.current = null }

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws`)
      wsRef.current = ws

      ws.onopen = () => {
        setWsStatus('connected')
        appendLog('>>> Bridge conectado — datos desde Arduino', 'normal')
      }

      ws.onmessage = (e: MessageEvent) => {
        try {
          const data: BridgeMessage = JSON.parse(e.data as string)
          bridgeMsg.current = data
          setWsHasData(data.connected === true)
          // Notificar al cambiar estado del Arduino
          if (prevArduinoConn.current !== data.connected) {
            prevArduinoConn.current = data.connected
            if (data.connected) appendLog('>>> Arduino conectado — recibiendo datos del sensor', 'normal')
            else                appendLog('>>> Arduino desconectado — sin señal serial', 'warn')
          }
        } catch (_) { /* ignorar JSON malformado */ }
      }

      ws.onclose = () => {
        wsRef.current = null
        bridgeMsg.current = null
        setWsStatus('disconnected')
        setWsHasData(false)
        appendLog('>>> Bridge desconectado — sin datos', 'warn')
        reconnTimer.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => { ws.close() }
    }

    connect()
    return () => {
      if (reconnTimer.current) clearTimeout(reconnTimer.current)
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close() }
    }
  }, [appendLog])

  // ── Loop rAF: historia, logs, alertas (throttling) ───────────────────────────
  useEffect(() => {
    let rafId: number
    const t = track.current

    const loop = (ts: number) => {
      if (t.lastTs === 0) { t.lastTs = ts; rafId = requestAnimationFrame(loop); return }
      const dt = Math.min(ts - t.lastTs, 100)
      t.lastTs = ts

      const bd = bridgeMsg.current
      if (!bd || !bd.connected) { rafId = requestAnimationFrame(loop); return }

      // Valores del bridge — null significa sensor sin lectura válida
      const hum  = bd.hum  ?? t.hum   // mantiene último valor si DHT11 da ERR
      const temp = bd.temp ?? t.temp  // mantiene último valor si DHT11 da ERR
      const dist = bd.dist ?? t.dist  // mantiene último valor si HC-SR04 sin eco
      t.hum  = hum
      t.temp = temp
      t.dist = dist
      t.ledGreen  = bd.ledGreen
      t.ledYellow = bd.ledYellow
      t.ledRed    = bd.ledRed

      const riskLevel = bd.riskLevel

      // Alerta al cambiar nivel de riesgo
      if (riskLevel !== t.prevRiskLevel) {
        t.prevRiskLevel = riskLevel
        appendAlert(riskLevel, ALERT_MESSAGES[riskLevel])
      }

      // Logs de cruce de umbral
      const humZone: 'fog' | 'normal' = hum >= UMBRAL_HUM ? 'fog' : 'normal'
      if (humZone !== t.prevHumZone) {
        t.prevHumZone = humZone
        if (humZone === 'fog') appendSensorLog('hum', `${hum.toFixed(0)}%`, `Umbral niebla superado (>=${UMBRAL_HUM}%) — LEDs verdes ON`, 'warn')
        else                   appendSensorLog('hum', `${hum.toFixed(0)}%`, `Humedad bajo umbral (<${UMBRAL_HUM}%) — LEDs verdes OFF`, 'normal')
      }
      const distZone: 'dentro' | 'fuera' = dist >= UMBRAL_DIST_MIN && dist <= UMBRAL_DIST_MAX ? 'dentro' : 'fuera'
      if (distZone !== t.prevDistZone) {
        t.prevDistZone = distZone
        if (distZone === 'dentro') appendSensorLog('dist', `${dist.toFixed(0)}cm`, `Vehículo entró a zona de detección (${UMBRAL_DIST_MIN}–${UMBRAL_DIST_MAX}cm)`, 'warn')
        else                       appendSensorLog('dist', `${dist.toFixed(0)}cm`, 'Vehículo fuera de zona de detección', 'normal')
      }

      // Lecturas periódicas por sensor cada 2s
      t.sensorTimer += dt
      if (t.sensorTimer >= 2000) {
        t.sensorTimer = 0
        const humType:  SensorLogEntry['type'] = hum >= UMBRAL_HUM ? 'warn' : 'normal'
        const tempType: SensorLogEntry['type'] = temp > 30 ? 'warn' : 'normal'
        const distType: SensorLogEntry['type'] = t.ledRed ? 'err' : t.ledYellow ? 'warn' : 'normal'
        appendSensorLog('hum',  `${hum.toFixed(0)}%`,               'Lectura DHT11 — Humedad ambiental',    humType)
        appendSensorLog('temp', temp > 0 ? `${temp.toFixed(1)}°C` : '---', 'Lectura DHT11 — Temperatura ambiental', tempType)
        appendSensorLog('dist', dist > 0 ? `${dist.toFixed(1)}cm` : '---',
          t.ledRed ? 'HC-SR04 — Vehículo DETENIDO' : t.ledYellow ? 'HC-SR04 — Vehículo en movimiento' : 'HC-SR04 — Sin vehículo en zona', distType)
      }

      // UI state (throttle 200ms)
      t.uiTimer += dt
      if (t.uiTimer >= 200) {
        t.uiTimer = 0
        setUiState({
          sensors:   { hum, temp, dist },
          leds:      { green: t.ledGreen, yellow: t.ledYellow, red: t.ledRed },
          riskLevel,
        })
      }

      // Monitor serial (500ms) — reenvía la línea real del firmware via bd.raw
      t.serialTimer += dt
      if (t.serialTimer >= 500) {
        t.serialTimer = 0
        const logType: LogEntry['type'] = t.ledRed ? 'err' : t.ledYellow ? 'warn' : 'normal'
        if (bd.raw) appendLog(bd.raw, logType)
      }

      // Historial (1s)
      t.histTimer += dt
      if (t.histTimer >= 1000) {
        t.histTimer = 0
        t.humHistory[t.histPtr]  = hum
        t.distHistory[t.histPtr] = dist
        t.histPtr = (t.histPtr + 1) % HIST_LEN
        setHistory({ hum: [...t.humHistory], dist: [...t.distHistory] })
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [appendLog, appendAlert, appendSensorLog])

  return { uiState, logs, alerts, sensorLogs, history, wsStatus, wsHasData }
}

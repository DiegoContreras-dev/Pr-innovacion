import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  UIState, LogEntry, AlertEntry, HistoryBuffer, RiskLevel,
  SensorLogEntry, SensorKey, BridgeMessage, ConnectionStatus,
} from '../types'

const HIST_LEN = 60

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
  hum: number; temp: number; dist1: number; dist2: number
  lastTs: number; uiTimer: number; serialTimer: number; histTimer: number; sensorTimer: number
  humHistory: HistoryBuffer; dist1History: HistoryBuffer; dist2History: HistoryBuffer; histPtr: number
  logId: number; alertId: number; sensorLogId: number
  prevRiskLevel: RiskLevel
  prevHumZone:   'normal' | 'fog'
  prevDist1Zone: 'fuera' | 'dentro'
  prevDist2Zone: 'fuera' | 'dentro'
  ledGreen: boolean; ledYellow: boolean; ledRed: boolean
}

export function useSimulation() {
  const track = useRef<TrackRef>({
    hum: 0, temp: 0, dist1: 0, dist2: 0,
    lastTs: 0, uiTimer: 0, serialTimer: 0, histTimer: 0, sensorTimer: 0,
    humHistory:   new Array(HIST_LEN).fill(null),
    dist1History: new Array(HIST_LEN).fill(null),
    dist2History: new Array(HIST_LEN).fill(null),
    histPtr: 0,
    logId: 2, alertId: 0, sensorLogId: 0,
    prevRiskLevel: 'standby',
    prevHumZone:   'normal',
    prevDist1Zone: 'fuera',
    prevDist2Zone: 'fuera',
    ledGreen: false, ledYellow: false, ledRed: false,
  })

  // ── WebSocket bridge ─────────────────────────────────────────────────────────
  const bridgeMsg       = useRef<BridgeMessage | null>(null)
  const wsRef           = useRef<WebSocket | null>(null)
  const reconnTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevArduinoConn = useRef<boolean | null>(null)

  const [wsStatus,  setWsStatus]  = useState<ConnectionStatus>('connecting')
  const [wsHasData, setWsHasData] = useState(false)

  // ── Estado UI ────────────────────────────────────────────────────────────────
  const [uiState, setUiState] = useState<UIState>({
    sensors:   { hum: 0, temp: 0, dist1: 0, dist2: 0 },
    leds:      { green: false, yellow: false, red: false },
    riskLevel: 'standby',
  })

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 0, time: nowTime(), msg: '=== Sistema Camanchaca UCN ===', type: 'normal' },
    { id: 1, time: nowTime(), msg: 'Conectando al bridge serial…',  type: 'normal' },
  ])

  const [alerts,     setAlerts]     = useState<AlertEntry[]>([])
  const [sensorLogs, setSensorLogs] = useState<SensorLogEntry[]>([])
  const [history, setHistory] = useState<{ hum: HistoryBuffer; dist1: HistoryBuffer; dist2: HistoryBuffer }>({
    hum:   new Array(HIST_LEN).fill(null),
    dist1: new Array(HIST_LEN).fill(null),
    dist2: new Array(HIST_LEN).fill(null),
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

      const hum   = bd.hum   ?? t.hum
      const temp  = bd.temp  ?? t.temp
      const dist1 = bd.dist1 ?? t.dist1
      const dist2 = bd.dist2 ?? t.dist2
      t.hum   = hum
      t.temp  = temp
      t.dist1 = dist1
      t.dist2 = dist2
      t.ledGreen  = bd.ledGreen
      t.ledYellow = bd.ledYellow
      t.ledRed    = bd.ledRed

      const riskLevel = bd.riskLevel

      // Alerta al cambiar nivel de riesgo
      if (riskLevel !== t.prevRiskLevel) {
        t.prevRiskLevel = riskLevel
        appendAlert(riskLevel, ALERT_MESSAGES[riskLevel])
      }

      // Logs de cruce de umbral — humedad
      const humZone: 'fog' | 'normal' = hum > 80 ? 'fog' : 'normal'
      if (humZone !== t.prevHumZone) {
        t.prevHumZone = humZone
        if (humZone === 'fog') appendSensorLog('hum', `${hum.toFixed(0)}%`, 'Umbral niebla superado (>80%) — LEDs verdes ON', 'warn')
        else                   appendSensorLog('hum', `${hum.toFixed(0)}%`, 'Humedad bajo umbral (<80%) — LEDs verdes OFF', 'normal')
      }

      // Logs de cruce de umbral — distancia 1
      const dist1Zone: 'dentro' | 'fuera' = dist1 > 0 ? 'dentro' : 'fuera'
      if (dist1Zone !== t.prevDist1Zone) {
        t.prevDist1Zone = dist1Zone
        if (dist1Zone === 'dentro') appendSensorLog('dist1', `${dist1.toFixed(1)}cm`, 'Sensor 1 — Vehículo entró a zona de detección', 'warn')
        else                        appendSensorLog('dist1', '---',                   'Sensor 1 — Sin vehículo en zona',                'normal')
      }

      // Logs de cruce de umbral — distancia 2
      const dist2Zone: 'dentro' | 'fuera' = dist2 > 0 ? 'dentro' : 'fuera'
      if (dist2Zone !== t.prevDist2Zone) {
        t.prevDist2Zone = dist2Zone
        if (dist2Zone === 'dentro') appendSensorLog('dist2', `${dist2.toFixed(1)}cm`, 'Sensor 2 — Vehículo entró a zona de detección', 'warn')
        else                        appendSensorLog('dist2', '---',                   'Sensor 2 — Sin vehículo en zona',                'normal')
      }

      // Lecturas periódicas por sensor cada 2s
      t.sensorTimer += dt
      if (t.sensorTimer >= 2000) {
        t.sensorTimer = 0
        const distType: SensorLogEntry['type'] = t.ledRed ? 'err' : t.ledYellow ? 'warn' : 'normal'
        appendSensorLog('hum',   `${hum.toFixed(0)}%`,               'Lectura DHT11 — Humedad ambiental',    hum  > 80 ? 'warn' : 'normal')
        appendSensorLog('temp',  temp  > 0 ? `${temp.toFixed(1)}°C`  : '---', 'Lectura DHT11 — Temperatura ambiental', temp > 30 ? 'warn' : 'normal')
        appendSensorLog('dist1', dist1 > 0 ? `${dist1.toFixed(1)}cm` : '---', 'HC-SR04 #1 — Carril A', distType)
        appendSensorLog('dist2', dist2 > 0 ? `${dist2.toFixed(1)}cm` : '---', 'HC-SR04 #2 — Carril B', distType)
      }

      // UI state (throttle 200ms)
      t.uiTimer += dt
      if (t.uiTimer >= 200) {
        t.uiTimer = 0
        setUiState({
          sensors:   { hum, temp, dist1, dist2 },
          leds:      { green: t.ledGreen, yellow: t.ledYellow, red: t.ledRed },
          riskLevel,
        })
      }

      // Monitor serial (500ms)
      t.serialTimer += dt
      if (t.serialTimer >= 500) {
        t.serialTimer = 0
        const logType   = t.ledRed ? 'err' : t.ledYellow ? 'warn' : 'normal' as LogEntry['type']
        const humStr    = hum   > 0 ? `${hum.toFixed(0)}%`    : '---'
        const tempStr   = temp  > 0 ? `${temp.toFixed(1)}°C`  : '---'
        const dist1Str  = dist1 > 0 ? `${dist1.toFixed(1)}cm` : '---'
        const dist2Str  = dist2 > 0 ? `${dist2.toFixed(1)}cm` : '---'
        const estado    = t.ledRed    ? '-> DETENIDO [ROJO]'
                        : t.ledYellow ? '-> EN MOVIMIENTO [AMARILLO]'
                        :               '-> SIN VEHICULO'
        appendLog(`Hum:${humStr}  Temp:${tempStr}  Dist1:${dist1Str}  Dist2:${dist2Str}  ${estado}`, logType)
      }

      // Historial (1s)
      t.histTimer += dt
      if (t.histTimer >= 1000) {
        t.histTimer = 0
        t.humHistory[t.histPtr]   = hum
        t.dist1History[t.histPtr] = dist1
        t.dist2History[t.histPtr] = dist2
        t.histPtr = (t.histPtr + 1) % HIST_LEN
        setHistory({ hum: [...t.humHistory], dist1: [...t.dist1History], dist2: [...t.dist2History] })
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [appendLog, appendAlert, appendSensorLog])

  return { uiState, logs, alerts, sensorLogs, history, wsStatus, wsHasData }
}

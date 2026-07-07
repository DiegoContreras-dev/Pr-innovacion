'use strict'

const { WebSocketServer } = require('ws')
const { SerialPort }      = require('serialport')
const { ReadlineParser }  = require('@serialport/parser-readline')

// ── Config ────────────────────────────────────────────────────────────────────
const WS_PORT    = parseInt(process.env.WS_PORT    || '3001', 10)
const BAUD       = 9600
const CANDIDATES = (process.env.SERIAL_PORTS || '/dev/ttyUSB0,/dev/ttyACM0,/dev/ttyUSB1,/dev/ttyACM1').split(',')

// Umbral idéntico a main.cpp — NO modificar sin cambiar el firmware también
const UMBRAL_HUM  = 80.0   // % → hum > 80 activa LEDs verdes

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: WS_PORT })
wss.on('listening', () => console.log(`[bridge] WS escuchando en :${WS_PORT}`))

function broadcast(payload) {
  const msg = JSON.stringify(payload)
  for (const client of wss.clients) {
    if (client.readyState === 1 /* OPEN */) client.send(msg)
  }
}

// ── Parser de línea serial del Arduino ───────────────────────────────────────
// Formato firmware dual: "Hum:73%  Temp:22.5C  S1:3.4cm  S2:4.1cm  -> EN MOVIMIENTO [AMARILLO]"
// Compat firmware anterior:  "Hum:73%  Temp:22.5C  Dist:3.4cm  -> EN MOVIMIENTO [AMARILLO]"
function parseLine(line) {
  const humMatch   = line.match(/Hum:([\d.]+)%/)
  const tempMatch  = line.match(/Temp:([\d.]+)C/)
  const dist1Match = line.match(/S1:([\d.]+)cm/)
  const dist2Match = line.match(/S2:([\d.]+)cm/)
  const distMatch  = line.match(/Dist:([\d.]+)cm/)  // compat firmware anterior

  const isSensorLine = line.includes('Hum:') || line.includes('S1:') ||
                       line.includes('S2:')   || line.includes('Dist:')
  if (!isSensorLine) return null

  const hum   = humMatch   ? parseFloat(humMatch[1])   : null
  const temp  = tempMatch  ? parseFloat(tempMatch[1])  : null
  const dist1 = dist1Match ? parseFloat(dist1Match[1]) : null
  const dist2 = dist2Match ? parseFloat(dist2Match[1]) : null

  // dist: valor combinado para compatibilidad con el dashboard existente
  const dist = distMatch               ? parseFloat(distMatch[1])
             : dist1 !== null && dist2 !== null ? (dist1 + dist2) / 2
             : dist1 !== null          ? dist1
             :                           dist2

  const ledYellow = line.includes('EN MOVIMIENTO')
  const ledRed    = line.includes('DETENIDO [ROJO]')
  // Prioridad: amarillo/rojo (vehículo en zona) apagan el verde, igual que en el firmware
  const ledGreen  = hum !== null && hum > UMBRAL_HUM && !ledYellow && !ledRed

  const riskLevel = ledRed    ? 'alerta'
                  : ledYellow ? 'precaucion'
                  : ledGreen  ? 'normal'
                  :             'standby'

  return {
    connected: true,
    hum, temp, dist, dist1, dist2,
    ledGreen, ledYellow, ledRed,
    riskLevel,
    raw: line.trim(),
    ts:  Date.now(),
  }
}

const HEARTBEAT_PAYLOAD = {
  connected: false,
  hum: null, temp: null, dist: null, dist1: null, dist2: null,
  ledGreen: false, ledYellow: false, ledRed: false,
  riskLevel: 'standby',
  raw: '',
}

let heartbeatInterval = null

function startHeartbeat() {
  if (heartbeatInterval) return
  heartbeatInterval = setInterval(() => {
    broadcast({ ...HEARTBEAT_PAYLOAD, ts: Date.now() })
  }, 3000)
}

function stopHeartbeat() {
  if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null }
}

// ── Conexión serial ───────────────────────────────────────────────────────────
async function tryOpenSerial() {
  for (const path of CANDIDATES) {
    try {
      const port = new SerialPort({ path, baudRate: BAUD, autoOpen: false })
      await new Promise((resolve, reject) => {
        port.open(err => (err ? reject(err) : resolve()))
      })
      return port
    } catch (_) { /* próximo candidato */ }
  }
  return null
}

async function startSerial() {
  const port = await tryOpenSerial()

  if (!port) {
    console.log('[bridge] Sin dispositivo serial — reintentando en 3s.')
    startHeartbeat()
    setTimeout(startSerial, 3000)
    return
  }

  stopHeartbeat()
  console.log(`[bridge] Arduino detectado @ ${BAUD} baud`)

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

  let confirmed = false
  let gone = false

  const onDisconnect = () => {
    if (gone) return
    gone = true
    port.removeAllListeners()
    console.log('[bridge] Arduino desconectado. Reintentando en 3s...')
    try { port.close() } catch (_) {}
    if (confirmed) broadcast({ ...HEARTBEAT_PAYLOAD, event: 'arduino_disconnected', ts: Date.now() })
    startHeartbeat()
    setTimeout(startSerial, 3000)
  }

  parser.on('data', line => {
    const trimmed = line.trim()
    if (!trimmed) return
    process.stdout.write(`[hw] ${trimmed}\n`)
    const payload = parseLine(trimmed)
    if (payload) {
      if (!confirmed) {
        confirmed = true
        broadcast({ ...HEARTBEAT_PAYLOAD, connected: true, event: 'arduino_connected', ts: Date.now() })
      }
      broadcast(payload)
    }
  })

  port.on('close', onDisconnect)
  port.on('error', err => { console.error(`[bridge] Error serial: ${err.message}`); onDisconnect() })
}

// ── Boot ──────────────────────────────────────────────────────────────────────
startSerial()

export interface SensorData {
  hum:  number
  dist: number
  temp: number
}

export interface LEDState {
  green:  boolean
  yellow: boolean
  red:    boolean
}

export type RiskLevel = 'standby' | 'normal' | 'precaucion' | 'alerta'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface UIState {
  sensors:   SensorData
  leds:      LEDState
  riskLevel: RiskLevel
}

export interface LogEntry {
  id:   number
  time: string
  msg:  string
  type: 'normal' | 'warn' | 'err'
}

export interface AlertEntry {
  id:      number
  time:    string
  level:   RiskLevel
  message: string
}

export type HistoryBuffer = (number | null)[]

export type SensorKey = 'hum' | 'dist' | 'temp'

export interface SensorLogEntry {
  id:     number
  time:   string
  sensor: SensorKey
  value:  string
  event:  string
  type:   'normal' | 'warn' | 'err'
}

// Mensaje que llega del bridge via WebSocket
export interface BridgeMessage {
  connected: boolean
  event?:    'arduino_connected' | 'arduino_disconnected'
  hum:       number | null   // null cuando DHT11 falla (Hum:ERR)
  temp:      number | null   // null cuando DHT11 falla (Temp:ERR)
  dist:      number | null   // null cuando ambos HC-SR04 sin eco; promedio si ambos detectan
  dist1:     number | null   // sensor 1 (S1:)
  dist2:     number | null   // sensor 2 (S2:)
  ledGreen:  boolean
  ledYellow: boolean
  ledRed:    boolean
  riskLevel: RiskLevel
  raw:       string
  ts:        number
}

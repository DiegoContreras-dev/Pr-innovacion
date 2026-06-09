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
  autoMode:  boolean
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
export type SceneName = 'niebla' | 'vehiculo' | 'emergencia' | 'despejado'

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
  connected: boolean         // false = heartbeat sin Arduino; true = Arduino detectado
  event?:    'arduino_connected' | 'arduino_disconnected'  // evento explícito de conexión
  hum:       number | null   // null cuando DHT11 falla (Hum:ERR)
  dist:      number | null   // null cuando HC-SR04 sin eco (Dist:---)
  ledGreen:  boolean
  ledYellow: boolean
  ledRed:    boolean
  riskLevel: RiskLevel
  raw:       string
  source:    'hardware' | 'simulation'
  ts:        number
}

export interface SensorData {
  hum:  number
  dist: number
  temp: number
  lux:  number
}

export interface LEDState {
  green:  boolean
  yellow: boolean
  red:    boolean
}

export type RiskLevel = 'standby' | 'normal' | 'precaucion' | 'alerta'

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

export type SensorKey = 'hum' | 'dist' | 'temp' | 'lux'

export interface SensorLogEntry {
  id:     number
  time:   string
  sensor: SensorKey
  value:  string
  event:  string
  type:   'normal' | 'warn' | 'err'
}


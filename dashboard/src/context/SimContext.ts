import { createContext, useContext } from 'react'
import type {
  UIState, LogEntry, AlertEntry, SensorLogEntry, HistoryBuffer,
  ConnectionStatus,
} from '../types'

export interface SimContextValue {
  uiState:    UIState
  logs:       LogEntry[]
  alerts:     AlertEntry[]
  sensorLogs: SensorLogEntry[]
  history:    { hum: HistoryBuffer; dist1: HistoryBuffer; dist2: HistoryBuffer }
  wsStatus:   ConnectionStatus
  wsHasData:  boolean
}

export const SimContext = createContext<SimContextValue | null>(null)

export function useSimContext(): SimContextValue {
  const ctx = useContext(SimContext)
  if (!ctx) throw new Error('useSimContext debe usarse dentro de SimProvider')
  return ctx
}

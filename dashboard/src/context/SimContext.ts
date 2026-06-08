import { createContext, useContext } from 'react'
import type { UIState, LogEntry, AlertEntry, SensorLogEntry, HistoryBuffer, SceneName } from '../types'

export interface SimContextValue {
  uiState:    UIState
  logs:       LogEntry[]
  alerts:     AlertEntry[]
  sensorLogs: SensorLogEntry[]
  history:    { hum: HistoryBuffer; dist: HistoryBuffer }
  setScene:   (s: SceneName) => void
  toggleAuto: () => void
  setSliders: (hum: number, dist: number) => void
}

export const SimContext = createContext<SimContextValue | null>(null)

export function useSimContext(): SimContextValue {
  const ctx = useContext(SimContext)
  if (!ctx) throw new Error('useSimContext debe usarse dentro de SimProvider')
  return ctx
}

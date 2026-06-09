import { useState, useEffect } from 'react'
import { useSimContext } from '../../context/SimContext'

export function Header() {
  const [time, setTime] = useState('--:--:--')
  const { wsStatus, wsHasData } = useSimContext()

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('es-CL', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  let statusLabel: string
  let statusCls: string

  if (wsStatus === 'connecting') {
    statusLabel = 'CONECTANDO…'
    statusCls   = 'text-gray-400'
  } else if (wsStatus === 'disconnected') {
    statusLabel = 'SIN BRIDGE'
    statusCls   = 'text-red-500'
  } else if (wsHasData) {
    statusLabel = 'EN VIVO · ARDUINO'
    statusCls   = 'text-emerald-600'
  } else {
    statusLabel = 'SIN ARDUINO'
    statusCls   = 'text-amber-500'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">Sistema Camanchaca UCN</h1>
        <p className="text-xs text-gray-400">Iluminación Vial Inteligente · Ruta 5 Norte · Coquimbo</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-gray-400 tabular-nums">{time}</span>
        <span className={`text-xs font-mono ${statusCls}`}>{statusLabel}</span>
      </div>
    </header>
  )
}

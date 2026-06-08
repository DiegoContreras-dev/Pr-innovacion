import { useState, useEffect } from 'react'

export function Header() {
  const [time, setTime] = useState('--:--:--')

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('es-CL', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-blue-400 flex items-center justify-center text-lg select-none">
          🌫️
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-zinc-100">
            Sistema Camanchaca UCN
          </h1>
          <p className="text-xs text-zinc-500">
            Iluminación Vial Inteligente · Ruta 5 Norte · Coquimbo
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-500 tabular-nums">{time}</span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          En vivo
        </span>
      </div>
    </header>
  )
}

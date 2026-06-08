import { Link } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import { useSimContext } from '../../context/SimContext'
import { Controls } from '../../components/Controls/Controls'
import type { SensorKey, SensorLogEntry } from '../../types'

const SENSORES: { key: SensorKey; label: string; icon: string; unit: string }[] = [
  { key: 'hum',  label: 'Humedad',     icon: '💧', unit: '%'  },
  { key: 'dist', label: 'Distancia',   icon: '📡', unit: 'cm' },
  { key: 'temp', label: 'Temperatura', icon: '🌡️', unit: '°C' },
  { key: 'lux',  label: 'Luminosidad', icon: '☀️', unit: 'lx' },
]

const TYPE_CLS: Record<SensorLogEntry['type'], string> = {
  normal: 'text-zinc-400',
  warn:   'text-amber-400',
  err:    'text-red-400',
}
const TYPE_DOT: Record<SensorLogEntry['type'], string> = {
  normal: 'bg-zinc-600',
  warn:   'bg-amber-400',
  err:    'bg-red-400',
}

function SensorLogCol({ sensorKey, label, icon, entries }: {
  sensorKey: SensorKey
  label: string
  icon: string
  entries: SensorLogEntry[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickRef  = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [entries])

  const handleScroll = () => {
    const el = scrollRef.current
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  const filtrados = entries.filter(e => e.sensor === sensorKey)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
      {/* Cabecera */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-xs font-bold text-zinc-300">{label}</p>
        <span className="ml-auto text-[10px] font-mono text-zinc-600 tabular-nums">
          {filtrados.length} eventos
        </span>
      </div>

      {/* Log */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-[260px] max-h-[340px]"
      >
        {filtrados.length === 0 ? (
          <p className="text-xs text-zinc-700 text-center py-6">Sin datos aún…</p>
        ) : (
          filtrados.map(entry => (
            <div key={entry.id} className="flex items-start gap-2 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${TYPE_DOT[entry.type]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-mono font-bold tabular-nums ${TYPE_CLS[entry.type]}`}>
                    {entry.value}
                  </span>
                  <span className="text-zinc-600 font-mono text-[10px]">{entry.time}</span>
                </div>
                <p className={`leading-snug ${TYPE_CLS[entry.type]} opacity-80`}>
                  {entry.event}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function PaginaSimulacion() {
  const { uiState, sensorLogs, setScene, toggleAuto, setSliders } = useSimContext()
  const { sensors, autoMode } = uiState

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Cabecera */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
        >
          ← Volver al dashboard
        </Link>
        <span className="text-zinc-700">|</span>
        <h1 className="text-sm font-bold text-zinc-100">Detalle de Simulación</h1>
      </div>

      <main className="flex-1 p-6 max-w-[1200px] mx-auto w-full flex flex-col gap-5">

        {/* Panel de controles (igual que en dashboard) */}
        <div className="max-w-sm">
          <Controls
            autoMode={autoMode}
            sensors={sensors}
            onToggleAuto={toggleAuto}
            onScene={setScene}
            onSliders={setSliders}
          />
        </div>

        {/* Logs por sensor */}
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
            Registros por sensor
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SENSORES.map(s => (
              <SensorLogCol
                key={s.key}
                sensorKey={s.key}
                label={s.label}
                icon={s.icon}
                entries={sensorLogs}
              />
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}

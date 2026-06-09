import { Link } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import { useSimContext } from '../../context/SimContext'
import type { SensorKey, SensorLogEntry } from '../../types'

const SENSORES: { key: SensorKey; label: string; unit: string }[] = [
  { key: 'hum',  label: 'Humedad',     unit: '%'  },
  { key: 'dist', label: 'Distancia',   unit: 'cm' },
  { key: 'lux',  label: 'Luminosidad', unit: 'lx' },
]

const TYPE_CLS: Record<SensorLogEntry['type'], string> = {
  normal: 'text-gray-600',
  warn:   'text-amber-600',
  err:    'text-red-600',
}
const TYPE_DOT: Record<SensorLogEntry['type'], string> = {
  normal: 'bg-gray-400',
  warn:   'bg-amber-400',
  err:    'bg-red-500',
}

function SensorLogCol({ sensorKey, label, entries }: {
  sensorKey: SensorKey
  label: string
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
    <div className="bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <span className="ml-auto text-[10px] font-mono text-gray-400 tabular-nums">
          {filtrados.length} eventos
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-[260px] max-h-[340px]"
      >
        {filtrados.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Sin datos aún…</p>
        ) : (
          filtrados.map(entry => (
            <div key={entry.id} className="flex items-start gap-2 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${TYPE_DOT[entry.type]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-mono font-bold tabular-nums ${TYPE_CLS[entry.type]}`}>
                    {entry.value}
                  </span>
                  <span className="text-gray-400 font-mono text-[10px]">{entry.time}</span>
                </div>
                <p className={`leading-snug ${TYPE_CLS[entry.type]} opacity-80`}>{entry.event}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function PaginaRegistros() {
  const { sensorLogs } = useSimContext()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
          ← Volver al dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-sm font-semibold text-gray-900">Registros por Sensor</h1>
      </div>

      <main className="flex-1 p-6 max-w-[1200px] mx-auto w-full flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">
            Historial de lecturas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SENSORES.map(s => (
              <SensorLogCol
                key={s.key}
                sensorKey={s.key}
                label={s.label}
                entries={sensorLogs}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useSimContext } from '../../context/SimContext'
import type { RiskLevel } from '../../types'

const LEVEL_STYLE: Record<RiskLevel, { row: string; badge: string; dot: string }> = {
  standby:    { row: 'border-zinc-800',    badge: 'bg-zinc-800 text-zinc-400',        dot: 'bg-zinc-500'    },
  normal:     { row: 'border-emerald-900', badge: 'bg-emerald-900 text-emerald-400',  dot: 'bg-emerald-400' },
  precaucion: { row: 'border-amber-900',   badge: 'bg-amber-900 text-amber-400',      dot: 'bg-amber-400'   },
  alerta:     { row: 'border-red-900',     badge: 'bg-red-900 text-red-400',          dot: 'bg-red-400'     },
}

const LEVEL_LABEL: Record<RiskLevel, string> = {
  standby: 'STANDBY', normal: 'GUÍA', precaucion: 'PRECAUCIÓN', alerta: 'PELIGRO',
}

export function PaginaAlertas() {
  const { alerts } = useSimContext()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header mínimo */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
        >
          ← Volver al dashboard
        </Link>
        <span className="text-zinc-700">|</span>
        <h1 className="text-sm font-bold text-zinc-100">Historial de Alertas</h1>
        <span className="ml-auto text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono">
          {alerts.length} entradas
        </span>
      </div>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full flex flex-col gap-4">

        {/* Resumen por nivel */}
        <div className="grid grid-cols-4 gap-3">
          {(['alerta', 'precaucion', 'normal', 'standby'] as RiskLevel[]).map(level => {
            const count = alerts.filter(a => a.level === level).length
            const s = LEVEL_STYLE[level]
            return (
              <div key={level} className={`rounded-xl border px-4 py-3 ${s.row}`}>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  {LEVEL_LABEL[level]}
                </p>
                <p className="text-2xl font-black tabular-nums">{count}</p>
              </div>
            )
          })}
        </div>

        {/* Lista completa */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Registro completo
            </p>
            <p className="text-[10px] text-zinc-600 font-mono">más reciente primero</p>
          </div>

          <div className="divide-y divide-zinc-800 max-h-[620px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-12">Sin alertas aún…</p>
            ) : (
              alerts.map((a, idx) => {
                const s = LEVEL_STYLE[a.level]
                return (
                  <div key={a.id} className={`px-4 py-3 flex gap-3 items-start ${idx === 0 ? 'bg-zinc-800/40' : ''}`}>
                    {/* Línea de tiempo */}
                    <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                      {idx < alerts.length - 1 && (
                        <div className="w-px flex-1 min-h-[20px] bg-zinc-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black px-2 py-px rounded ${s.badge}`}>
                          {LEVEL_LABEL[a.level]}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">{a.time}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-900 px-1.5 py-px rounded font-bold">
                            ÚLTIMA
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300">{a.message}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

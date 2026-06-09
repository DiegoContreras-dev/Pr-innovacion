import { Link } from 'react-router-dom'
import { useSimContext } from '../../context/SimContext'
import type { RiskLevel } from '../../types'

const LEVEL_STYLE: Record<RiskLevel, { row: string; badge: string; dot: string }> = {
  standby:    { row: 'border-gray-200',    badge: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-400'    },
  normal:     { row: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  precaucion: { row: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400'   },
  alerta:     { row: 'border-red-200',     badge: 'bg-red-100 text-red-700',         dot: 'bg-red-500'     },
}

const LEVEL_LABEL: Record<RiskLevel, string> = {
  standby: 'STANDBY', normal: 'GUÍA', precaucion: 'PRECAUCIÓN', alerta: 'PELIGRO',
}

export function PaginaAlertas() {
  const { alerts } = useSimContext()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
          ← Volver al dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-sm font-semibold text-gray-900">Historial de Alertas</h1>
        <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
          {alerts.length} entradas
        </span>
      </div>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full flex flex-col gap-4">

        <div className="grid grid-cols-4 gap-3">
          {(['alerta', 'precaucion', 'normal', 'standby'] as RiskLevel[]).map(level => {
            const count = alerts.filter(a => a.level === level).length
            const s = LEVEL_STYLE[level]
            return (
              <div key={level} className={`rounded-lg border px-4 py-3 bg-white ${s.row}`}>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">
                  {LEVEL_LABEL[level]}
                </p>
                <p className="text-2xl font-bold tabular-nums text-gray-900">{count}</p>
              </div>
            )
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Registro completo</p>
            <p className="text-[10px] text-gray-400 font-mono">más reciente primero</p>
          </div>

          <div className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">Sin alertas aún…</p>
            ) : (
              alerts.map((a, idx) => {
                const s = LEVEL_STYLE[a.level]
                return (
                  <div key={a.id} className={`px-4 py-3 flex gap-3 items-start ${idx === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                      {idx < alerts.length - 1 && (
                        <div className="w-px flex-1 min-h-[20px] bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-px rounded ${s.badge}`}>
                          {LEVEL_LABEL[a.level]}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400">{a.time}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-px rounded font-bold">
                            ÚLTIMA
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{a.message}</p>
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

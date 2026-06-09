import { Link } from 'react-router-dom'
import type { AlertEntry, RiskLevel } from '../../types'

interface Props { alerts: AlertEntry[] }

const LEVEL_STYLE: Record<RiskLevel, { row: string; badge: string; dot: string }> = {
  standby:    { row: 'border-gray-200',    badge: 'bg-gray-100 text-gray-500',        dot: 'bg-gray-400'    },
  normal:     { row: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700',  dot: 'bg-emerald-500' },
  precaucion: { row: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',      dot: 'bg-amber-400'   },
  alerta:     { row: 'border-red-200',     badge: 'bg-red-100 text-red-700',          dot: 'bg-red-500'     },
}

const LEVEL_LABEL: Record<RiskLevel, string> = {
  standby: 'STANDBY', normal: 'GUÍA', precaucion: 'PRECAUCIÓN', alerta: 'PELIGRO',
}

export function AlertFeed({ alerts }: Props) {
  const preview = alerts.slice(0, 3)

  return (
    <Link
      to="/alertas"
      className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3
                 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Historial de alertas</p>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
              {alerts.length}
            </span>
          )}
          <span className="text-[10px] text-gray-400 group-hover:text-gray-600 transition-colors">Ver todas →</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {preview.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin alertas aún…</p>
        ) : (
          preview.map((a, idx) => {
            const s = LEVEL_STYLE[a.level]
            return (
              <div
                key={a.id}
                className={[
                  'rounded-md border px-3 py-2 flex gap-2.5 items-start text-xs',
                  s.row,
                  idx === 0 ? 'bg-gray-50' : 'bg-white',
                ].join(' ')}
              >
                <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-px rounded ${s.badge}`}>
                      {LEVEL_LABEL[a.level]}
                    </span>
                    <span className="text-gray-400 font-mono text-[10px]">{a.time}</span>
                  </div>
                  <p className="text-gray-600 leading-snug truncate">{a.message}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {alerts.length > 3 && (
        <p className="text-[10px] text-center text-gray-400 group-hover:text-gray-500 transition-colors">
          + {alerts.length - 3} alertas más
        </p>
      )}
    </Link>
  )
}

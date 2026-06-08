import { Link } from 'react-router-dom'
import type { AlertEntry, RiskLevel } from '../../types'

interface Props { alerts: AlertEntry[] }

const LEVEL_STYLE: Record<RiskLevel, { row: string; badge: string; dot: string }> = {
  standby:    { row: 'border-zinc-800',   badge: 'bg-zinc-800 text-zinc-400',      dot: 'bg-zinc-500'   },
  normal:     { row: 'border-emerald-900', badge: 'bg-emerald-900 text-emerald-400', dot: 'bg-emerald-400' },
  precaucion: { row: 'border-amber-900',   badge: 'bg-amber-900 text-amber-400',     dot: 'bg-amber-400'   },
  alerta:     { row: 'border-red-900',     badge: 'bg-red-900 text-red-400',         dot: 'bg-red-400'     },
}

const LEVEL_LABEL: Record<RiskLevel, string> = {
  standby: 'STANDBY', normal: 'GUÍA', precaucion: 'PRECAUCIÓN', alerta: 'PELIGRO',
}

export function AlertFeed({ alerts }: Props) {
  const preview = alerts.slice(0, 3)

  return (
    <Link
      to="/alertas"
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3
                 hover:border-zinc-600 hover:bg-zinc-800/60 transition-all duration-200 group"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Historial de alertas
        </p>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono">
              {alerts.length}
            </span>
          )}
          <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
            Ver todas →
          </span>
        </div>
      </div>

      {/* Preview: últimas 3 */}
      <div className="flex flex-col gap-2">
        {preview.length === 0 ? (
          <p className="text-xs text-zinc-700 text-center py-4">Sin alertas aún…</p>
        ) : (
          preview.map((a, idx) => {
            const s = LEVEL_STYLE[a.level]
            return (
              <div
                key={a.id}
                className={[
                  'rounded-lg border px-3 py-2 flex gap-2.5 items-start text-xs',
                  s.row,
                  idx === 0 ? 'bg-zinc-800/50' : '',
                ].join(' ')}
              >
                <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-black px-1.5 py-px rounded ${s.badge}`}>
                      {LEVEL_LABEL[a.level]}
                    </span>
                    <span className="text-zinc-600 font-mono text-[10px]">{a.time}</span>
                  </div>
                  <p className="text-zinc-400 leading-snug truncate">{a.message}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer si hay más */}
      {alerts.length > 3 && (
        <p className="text-[10px] text-center text-zinc-600 group-hover:text-zinc-500 transition-colors">
          + {alerts.length - 3} alertas más
        </p>
      )}
    </Link>
  )
}

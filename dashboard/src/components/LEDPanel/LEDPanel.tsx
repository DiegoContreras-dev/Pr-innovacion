import type { LEDState } from '../../types'

interface Props { leds: LEDState }

const LEDS = [
  {
    key:   'green' as const,
    label: 'LED Verde',
    sub:   'Camanchaca activa · guía estándar',
    rowOn:  'bg-emerald-950 border-emerald-800',
    dotOn:  'bg-emerald-400 shadow-[0_0_8px_3px_rgba(52,211,153,0.5)]',
    dotOff: 'bg-zinc-700',
  },
  {
    key:   'yellow' as const,
    label: 'LED Amarillo',
    sub:   'Vehículo en movimiento',
    rowOn:  'bg-amber-950 border-amber-800',
    dotOn:  'bg-amber-400 shadow-[0_0_8px_3px_rgba(251,191,36,0.5)]',
    dotOff: 'bg-zinc-700',
  },
  {
    key:   'red' as const,
    label: 'LED Rojo',
    sub:   'Vehículo detenido · peligro',
    rowOn:  'bg-red-950 border-red-800',
    dotOn:  'bg-red-400 shadow-[0_0_8px_3px_rgba(248,113,113,0.5)]',
    dotOff: 'bg-zinc-700',
  },
]

export function LEDPanel({ leds }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
        Estado LEDs
      </p>
      <div className="flex flex-col gap-2">
        {LEDS.map(({ key, label, sub, rowOn, dotOn, dotOff }) => {
          const on = leds[key]
          return (
            <div
              key={key}
              className={[
                'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-300',
                on ? rowOn : 'bg-zinc-800 border-zinc-700',
              ].join(' ')}
            >
              <div
                className={[
                  'w-4 h-4 rounded-full flex-shrink-0 transition-all duration-300',
                  on ? `${dotOn} led-glow` : dotOff,
                ].join(' ')}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100 leading-none">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{sub}</p>
              </div>
              <span
                className={[
                  'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-colors',
                  on ? 'bg-black/30 text-zinc-100' : 'bg-zinc-900 text-zinc-600',
                ].join(' ')}
              >
                {on ? 'ON' : 'OFF'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

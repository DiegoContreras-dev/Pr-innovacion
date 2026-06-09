import type { LEDState } from '../../types'

interface Props { leds: LEDState }

const LEDS = [
  {
    key:   'green' as const,
    label: 'LED Verde',
    sub:   'Camanchaca activa · guía estándar',
    rowOn:  'bg-emerald-50 border-emerald-200',
    dotOn:  'bg-emerald-500',
    dotOff: 'bg-gray-300',
  },
  {
    key:   'yellow' as const,
    label: 'LED Amarillo',
    sub:   'Vehículo en movimiento',
    rowOn:  'bg-amber-50 border-amber-200',
    dotOn:  'bg-amber-400',
    dotOff: 'bg-gray-300',
  },
  {
    key:   'red' as const,
    label: 'LED Rojo',
    sub:   'Vehículo detenido · peligro',
    rowOn:  'bg-red-50 border-red-200',
    dotOn:  'bg-red-500',
    dotOff: 'bg-gray-300',
  },
]

export function LEDPanel({ leds }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Estado LEDs</p>
      <div className="flex flex-col gap-2">
        {LEDS.map(({ key, label, sub, rowOn, dotOn, dotOff }) => {
          const on = leds[key]
          return (
            <div
              key={key}
              className={[
                'flex items-center gap-3 rounded-md border px-3 py-2 transition-colors duration-200',
                on ? rowOn : 'bg-gray-50 border-gray-200',
              ].join(' ')}
            >
              <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-200 ${on ? dotOn : dotOff}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 leading-none">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>
              </div>
              <span className={`text-[10px] font-bold flex-shrink-0 ${on ? 'text-gray-700' : 'text-gray-400'}`}>
                {on ? 'ON' : 'OFF'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

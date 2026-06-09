import type { RiskLevel } from '../../types'

interface Props { level: RiskLevel }

const CONFIG: Record<RiskLevel, { label: string; desc: string; cls: string }> = {
  standby: {
    label: 'STANDBY',
    desc:  'Sin condiciones críticas — sistema en espera',
    cls:   'border-gray-200 bg-gray-50 text-gray-600',
  },
  normal: {
    label: 'GUÍA ACTIVA',
    desc:  'Camanchaca detectada · LEDs verdes de guiado encendidos',
    cls:   'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  precaucion: {
    label: 'PRECAUCIÓN',
    desc:  'Vehículo en movimiento detectado · LEDs amarillos activos',
    cls:   'border-amber-200 bg-amber-50 text-amber-700',
  },
  alerta: {
    label: 'PELIGRO',
    desc:  'Vehículo DETENIDO en la vía · LEDs rojos activos — reducir velocidad',
    cls:   'border-red-200 bg-red-50 text-red-700',
  },
}

export function RiskBanner({ level }: Props) {
  const { label, desc, cls } = CONFIG[level]
  return (
    <div className={`rounded-lg border px-4 py-3 flex items-center gap-4 transition-colors duration-300 ${cls}`}>
      <div className="flex-1">
        <p className="text-[10px] font-medium tracking-widest opacity-60 uppercase mb-0.5">Nivel de riesgo</p>
        <p className="text-sm font-bold tracking-tight">{label}</p>
        <p className="text-xs opacity-70 mt-0.5">{desc}</p>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-0.5 text-right opacity-40 text-[10px] font-mono">
        <span>hum &gt; 80% → verde</span>
        <span>dist &lt; 150cm → amarillo</span>
        <span>detenido → rojo</span>
      </div>
    </div>
  )
}

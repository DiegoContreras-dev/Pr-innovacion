import type { RiskLevel } from '../../types'

interface Props { level: RiskLevel }

const CONFIG: Record<RiskLevel, {
  icon: string; label: string; desc: string; cls: string; pulse?: boolean
}> = {
  standby: {
    icon: '○',
    label: 'STANDBY',
    desc: 'Sin condiciones críticas — sistema en espera',
    cls: 'border-zinc-700 bg-zinc-900 text-zinc-400',
  },
  normal: {
    icon: '●',
    label: 'GUÍA ACTIVA',
    desc: 'Camanchaca detectada · LEDs verdes de guiado encendidos',
    cls: 'border-emerald-800 bg-emerald-950 text-emerald-400',
  },
  precaucion: {
    icon: '▲',
    label: 'PRECAUCIÓN',
    desc: 'Vehículo en movimiento detectado · LEDs amarillos activos',
    cls: 'border-amber-800 bg-amber-950 text-amber-400',
  },
  alerta: {
    icon: '■',
    label: 'PELIGRO',
    desc: 'Vehículo DETENIDO en la vía · LEDs rojos activos — reducir velocidad',
    cls: 'border-red-700 bg-red-950 text-red-400',
    pulse: true,
  },
}

export function RiskBanner({ level }: Props) {
  const { icon, label, desc, cls, pulse } = CONFIG[level]
  return (
    <div
      className={[
        'rounded-xl border-2 px-5 py-4 flex items-center gap-4 transition-all duration-500',
        cls,
        pulse ? 'animate-pulse' : '',
      ].join(' ')}
    >
      <span className="text-3xl font-black leading-none select-none">{icon}</span>
      <div className="flex-1">
        <p className="text-[10px] font-bold tracking-[0.15em] opacity-60 uppercase mb-0.5">
          Nivel de riesgo
        </p>
        <p className="text-xl font-extrabold tracking-tight leading-none">{label}</p>
        <p className="text-sm opacity-70 mt-1 leading-snug">{desc}</p>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1 text-right opacity-40 text-xs font-mono">
        <span>hum &gt; 80% → verde</span>
        <span>dist &lt; 150cm → amarillo</span>
        <span>detenido → rojo</span>
      </div>
    </div>
  )
}

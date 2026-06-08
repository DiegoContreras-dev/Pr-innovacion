import { Link } from 'react-router-dom'
import type { SensorData, SceneName } from '../../types'

interface Props {
  autoMode:     boolean
  sensors:      SensorData
  onToggleAuto: () => void
  onScene:      (s: SceneName) => void
  onSliders:    (hum: number, dist: number) => void
}

const SCENES: { key: SceneName; label: string }[] = [
  { key: 'niebla',     label: 'Niebla'     },
  { key: 'vehiculo',   label: 'Vehículo'   },
  { key: 'emergencia', label: 'Emergencia' },
  { key: 'despejado',  label: 'Despejado'  },
]

export function Controls({ autoMode, sensors, onToggleAuto, onScene, onSliders }: Props) {
  const hum  = Math.round(sensors.hum)
  const dist = Math.round(sensors.dist)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
        Simulación
      </p>

      {/* Sliders */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-zinc-400 font-medium">Humedad</span>
            <span className="text-zinc-500 font-mono tabular-nums">{hum}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={hum}
            disabled={autoMode}
            onChange={e => onSliders(Number(e.target.value), dist)}
            className="slider w-full"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-zinc-400 font-medium">Distancia al vehículo</span>
            <span className="text-zinc-500 font-mono tabular-nums">{dist} cm</span>
          </div>
          <input
            type="range" min={0} max={400} value={dist}
            disabled={autoMode}
            onChange={e => onSliders(hum, Number(e.target.value))}
            className="slider w-full"
          />
        </div>
      </div>

      {/* Scene buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        {SCENES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onScene(key)}
            className="text-xs font-semibold px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700
                       text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Auto toggle */}
      <button
        onClick={onToggleAuto}
        className={[
          'text-xs font-bold py-2 rounded-lg border transition-colors w-full',
          autoMode
            ? 'bg-blue-950 border-blue-700 text-blue-400'
            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600',
        ].join(' ')}
      >
        ⚙️ Auto-simulación: {autoMode ? 'ON' : 'OFF'}
      </button>

      {/* Enlace a detalle */}
      <Link
        to="/simulacion"
        className="text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
      >
        Ver registros por sensor →
      </Link>
    </div>
  )
}

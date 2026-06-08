interface Props {
  icon:      string
  label:     string
  value:     number
  unit:      string
  max:       number
  barColor:  string
  invalid?:  boolean
  decimal?:  boolean
}

export function SensorCard({ icon, label, value, unit, max, barColor, invalid, decimal }: Props) {
  const pct     = Math.min(100, (value / max) * 100)
  const display = invalid ? '---' : decimal ? value.toFixed(1) : value.toFixed(0)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
        <span className="text-base select-none">{icon}</span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black tracking-tight text-zinc-100 tabular-nums leading-none">
          {display}
        </span>
        <span className="text-sm text-zinc-500 font-medium">{unit}</span>
      </div>

      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: invalid ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

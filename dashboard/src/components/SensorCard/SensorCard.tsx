interface Props {
  label:     string
  value:     number
  unit:      string
  max:       number
  barColor:  string
  invalid?:  boolean
  decimal?:  boolean
}

export function SensorCard({ label, value, unit, max, barColor, invalid, decimal }: Props) {
  const pct     = Math.min(100, (value / max) * 100)
  const display = invalid ? '---' : decimal ? value.toFixed(1) : value.toFixed(0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">{display}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: invalid ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

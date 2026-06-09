import { useRef, useEffect, useState } from 'react'
import type { HistoryBuffer } from '../../types'

const HIST_LEN = 60
const H    = 160
const PAD  = { top: 16, right: 12, bottom: 28, left: 44 }

function buildPath(data: HistoryBuffer, maxVal: number, iw: number, ih: number): string {
  let d = '', first = true
  for (let i = 0; i < HIST_LEN; i++) {
    const v = data[i]
    if (v === null) { first = true; continue }
    const x = (i / (HIST_LEN - 1)) * iw
    const y = ih - (Math.min(v, maxVal) / maxVal) * ih
    d += `${first ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `
    first = false
  }
  return d
}

interface Props {
  hum:  HistoryBuffer
  dist: HistoryBuffer
}

export function SvgChart({ hum, dist }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      setWidth(Math.floor(entries[0].contentRect.width))
    })
    obs.observe(el)
    setWidth(el.clientWidth)
    return () => obs.disconnect()
  }, [])

  const IW = width - PAD.left - PAD.right
  const IH = H - PAD.top - PAD.bottom

  const humPath  = buildPath(hum,  100, IW, IH)
  const distPath = buildPath(dist, 400, IW, IH)

  const yTicks = [0, 25, 50, 75, 100]

  const lastHum  = [...hum].reverse().find(v => v !== null) ?? null
  const lastDist = [...dist].reverse().find(v => v !== null) ?? null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
          Historial de sensores — últimos 60 s
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-px bg-blue-500 inline-block" />
            Humedad {lastHum !== null ? `${lastHum.toFixed(0)}%` : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-px bg-emerald-500 inline-block" />
            Distancia {lastDist !== null ? `${lastDist.toFixed(0)} cm` : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 border-t border-dashed border-blue-400 inline-block" />
            Umbral niebla (80%)
          </span>
        </div>
      </div>

      <div ref={wrapRef}>
        <svg width={width} height={H} className="block overflow-visible">
          <g transform={`translate(${PAD.left},${PAD.top})`}>

            {yTicks.map(v => {
              const y = IH - (v / 100) * IH
              return (
                <g key={v}>
                  <line x1={0} y1={y} x2={IW} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  <text x={-8} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af" fontFamily="monospace">
                    {v}
                  </text>
                </g>
              )
            })}

            <line
              x1={0} y1={IH * 0.2} x2={IW} y2={IH * 0.2}
              stroke="#3b82f6" strokeWidth="1" strokeDasharray="5,4" opacity="0.4"
            />

            {distPath && (
              <path d={distPath} fill="none" stroke="#10b981" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
            )}
            {humPath && (
              <path d={humPath} fill="none" stroke="#3b82f6" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
            )}

            <line x1={0} y1={0}  x2={0}  y2={IH} stroke="#e5e7eb" strokeWidth="1" />
            <line x1={0} y1={IH} x2={IW} y2={IH} stroke="#e5e7eb" strokeWidth="1" />

            {[0, 15, 30, 45, 60].map(s => {
              const x = (s / (HIST_LEN - 1)) * IW
              return (
                <text key={s} x={x} y={IH + 16} textAnchor="middle"
                      fontSize="9" fill="#9ca3af" fontFamily="monospace">
                  -{60 - s}s
                </text>
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}

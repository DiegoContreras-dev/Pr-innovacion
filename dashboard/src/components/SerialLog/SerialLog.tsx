import { useRef, useEffect } from 'react'
import type { LogEntry } from '../../types'

interface Props { logs: LogEntry[] }

const TYPE_CLS: Record<LogEntry['type'], string> = {
  normal: 'text-gray-600',
  warn:   'text-amber-600',
  err:    'text-red-600',
}

const TYPE_GUTTER: Record<LogEntry['type'], string> = {
  normal: 'text-gray-300',
  warn:   'text-amber-300',
  err:    'text-red-300',
}

export function SerialLog({ logs }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickRef  = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickRef.current) return
    el.scrollTop = el.scrollHeight
  }, [logs])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Monitor serial</p>
        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
          <span>9600 baud</span>
          <span className="w-px h-3 bg-gray-200" />
          <span>{logs.length} líneas</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="bg-gray-50 rounded-md border border-gray-200 p-3 h-44 overflow-y-auto"
      >
        <table className="w-full border-collapse text-xs font-mono">
          <tbody>
            {logs.map((entry, idx) => (
              <tr key={entry.id} className={`leading-5 ${TYPE_CLS[entry.type]}`}>
                <td className={`pr-3 select-none text-right w-10 ${TYPE_GUTTER[entry.type]}`}>
                  {idx + 1}
                </td>
                <td className="pr-3 select-none text-gray-400 whitespace-nowrap">
                  [{entry.time}]
                </td>
                <td className="break-all">{entry.msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

interface Props {
  hour: number
  duration: number
  onHourChange: (h: number) => void
  onDurationChange: (d: number) => void
}

const QUICK_CHIPS = [
  { label: '지금 바로', getHour: () => new Date().getHours() },
  { label: '오후 나서기', getHour: () => 14 },
  { label: '이따 저녁', getHour: () => 18 },
  { label: '내일 아침', getHour: () => 9 },
]

export function TimeQuickPicker({ hour, duration, onHourChange, onDurationChange }: Props) {
  const [expanded, setExpanded] = useState(false)
  const currentHour = new Date().getHours()

  const activeChip = QUICK_CHIPS.findIndex((c) => {
    const ch = c.getHour()
    if (c.label === '지금 바로') return hour === currentHour
    return hour === ch
  })

  function formatHour(h: number) {
    const ampm = h < 12 ? '오전' : '오후'
    const h12 = h % 12 || 12
    return `${ampm} ${h12}시`
  }

  return (
    <div>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
        활동 시간
      </p>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_CHIPS.map((chip, i) => {
          const selected = activeChip === i
          return (
            <button
              key={chip.label}
              onClick={() => onHourChange(chip.getHour())}
              className="text-sm px-3 py-1.5 rounded-full transition-all"
              style={{
                background: selected ? 'var(--accent)' : 'var(--surface)',
                color: selected ? 'white' : 'var(--text)',
                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                fontWeight: selected ? '600' : '400',
              }}
              aria-pressed={selected}
            >
              {chip.label}
            </button>
          )
        })}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm px-3 py-1.5 rounded-full transition-all"
          style={{
            background: expanded ? 'rgba(91,141,238,0.1)' : 'var(--surface)',
            color: 'var(--humidity)',
            border: `1px solid ${expanded ? 'var(--humidity)' : 'var(--border)'}`,
          }}
          aria-expanded={expanded}
        >
          직접 설정 {expanded ? '▲' : '▾'}
        </button>
      </div>

      {/* Expanded slider */}
      {expanded && (
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border)' }}
        >
          <div>
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--muted)' }}>
              <span>시작 시간</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{formatHour(hour)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => onHourChange(Number(e.target.value))}
              className="w-full accent-[#FFB547]"
              aria-label="시작 시간 슬라이더"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted)' }}>
              <span>자정</span>
              <span>정오</span>
              <span>자정</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--muted)' }}>
              <span>활동 시간</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{duration}시간</span>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={duration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full accent-[#FFB547]"
              aria-label="활동 시간 슬라이더"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted)' }}>
              <span>1시간</span>
              <span>6시간</span>
              <span>12시간</span>
            </div>
          </div>
        </div>
      )}

      {!expanded && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {formatHour(hour)} 출발 · {duration}시간
        </p>
      )}
    </div>
  )
}

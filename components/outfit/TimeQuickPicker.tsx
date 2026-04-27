'use client'

import { useState, useRef, useEffect } from 'react'

const CRITERIA_ROWS = [
  { range: '28°C 이상', label: '덥다! 가볍게', layer: '1레이어', color: '#EF4444' },
  { range: '23~27°C', label: '따뜻해요', layer: '1레이어', color: '#F59E0B' },
  { range: '17~22°C', label: '선선해요', layer: '2레이어', color: '#22C55E' },
  { range: '12~16°C', label: '쌀쌀해요', layer: '2레이어', color: '#3B82F6' },
  { range: '5~11°C', label: '추워요', layer: '3레이어', color: '#6366F1' },
  { range: '4°C 이하', label: '매우 추워요', layer: '3레이어', color: '#8B5CF6' },
]

const EXTRA_CRITERIA = [
  { icon: '☀️', label: 'UV 6 이상', desc: '선크림 추가' },
  { icon: '😷', label: '미세먼지 나쁨', desc: 'KF80 마스크' },
  { icon: '😷', label: '미세먼지 매우나쁨', desc: 'KF94 마스크' },
  { icon: '💨', label: '바람 10m/s 이상', desc: '방풍 아우터' },
  { icon: '🌧', label: '강수 발생 시', desc: '우산·우의 추가' },
]

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
  const [showCriteria, setShowCriteria] = useState(false)
  const criteriaRef = useRef<HTMLDivElement>(null)
  const currentHour = new Date().getHours()

  useEffect(() => {
    if (!showCriteria) return
    function handleClickOutside(e: MouseEvent) {
      if (criteriaRef.current && !criteriaRef.current.contains(e.target as Node)) {
        setShowCriteria(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCriteria])

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
      <div className="flex items-center gap-1.5 mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          활동 시간
        </p>
        <div className="relative" ref={criteriaRef}>
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0"
            style={{
              background: showCriteria ? 'var(--humidity)' : 'rgba(91,141,238,0.15)',
              color: showCriteria ? 'white' : 'var(--humidity)',
              border: '1px solid rgba(91,141,238,0.3)',
            }}
            aria-label="복장 추천 기준 보기"
          >
            i
          </button>

          {showCriteria && (
            <div
              className="absolute left-0 top-6 z-50 rounded-2xl shadow-lg p-3 w-64"
              style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--primary)' }}>복장 추천 기준</p>

              {/* Temperature zones */}
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>체감온도 → 레이어</p>
              <div className="space-y-1 mb-3">
                {CRITERIA_ROWS.map((row) => (
                  <div key={row.range} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                      <span className="text-xs" style={{ color: 'var(--text)' }}>{row.range}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{row.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${row.color}18`, color: row.color }}>
                        {row.layer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Extra criteria */}
              <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>추가 아이템 조건</p>
                <div className="space-y-1">
                  {EXTRA_CRITERIA.map((c) => (
                    <div key={c.label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text)' }}>{c.icon} {c.label}</span>
                      <span className="text-xs" style={{ color: 'var(--accent)' }}>→ {c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

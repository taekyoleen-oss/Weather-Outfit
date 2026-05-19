'use client'

import type { DailyForecast } from '@/types/weather'

interface Props {
  daily: DailyForecast[]
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
function dayLabel(dateStr: string): string {
  const y = parseInt(dateStr.slice(0, 4), 10)
  const mo = parseInt(dateStr.slice(4, 6), 10) - 1
  const d = parseInt(dateStr.slice(6, 8), 10)
  const utc = new Date(Date.UTC(y, mo, d, 12, 0, 0))
  return DAY_LABELS[utc.getUTCDay()] ?? ''
}

function isRainy(d: DailyForecast): boolean {
  if ((d.ptyCode ?? '0') !== '0') return true
  const am = d.amPop
  const pm = d.pmPop
  const pop = d.pop
  const popMax = Math.max(am ?? -1, pm ?? -1, pop ?? -1)
  return popMax >= 50
}

function isClear(d: DailyForecast): boolean {
  return d.skyCode === '1' && (d.ptyCode ?? '0') === '0'
}

export function WeeklySummaryStrip({ daily }: Props) {
  if (daily.length === 0) return null

  const maxDay = daily.reduce((best, d) => (d.maxTemp > best.maxTemp ? d : best), daily[0]!)
  const minDay = daily.reduce((best, d) => (d.minTemp < best.minTemp ? d : best), daily[0]!)
  const rainyCount = daily.filter(isRainy).length
  const clearCount = daily.filter(isClear).length

  const items = [
    {
      icon: '🔥',
      label: '주간 최고',
      main: `${dayLabel(maxDay.date)} ${Math.round(maxDay.maxTemp)}°`,
      color: '#dc2626',
    },
    {
      icon: '❄️',
      label: '주간 최저',
      main: `${dayLabel(minDay.date)} ${Math.round(minDay.minTemp)}°`,
      color: '#1d4ed8',
    },
    {
      icon: '☔',
      label: '비 오는 날',
      main: `${rainyCount}일`,
      color: rainyCount > 0 ? '#1d4ed8' : 'var(--muted)',
    },
    {
      icon: '☀️',
      label: '맑은 날',
      main: `${clearCount}일`,
      color: clearCount > 0 ? '#d97706' : 'var(--muted)',
    },
  ]

  return (
    <div
      className="rounded-2xl px-3 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}
    >
      <p className="text-[11px] font-semibold mb-2 px-1" style={{ color: 'var(--muted)' }}>
        이번 주 한눈에 보기
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((it, i) => (
          <div
            key={i}
            className="rounded-xl px-2 py-2 text-center"
            style={{ background: 'var(--colors-surface-filter)', border: '1px solid var(--border)' }}
          >
            <p className="text-base leading-none mb-1" aria-hidden>{it.icon}</p>
            <p className="text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>{it.label}</p>
            <p className="text-xs font-bold tabular-nums leading-tight" style={{ color: it.color }}>{it.main}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

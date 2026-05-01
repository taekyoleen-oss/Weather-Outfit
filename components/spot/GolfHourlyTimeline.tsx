'use client'

import type { GolfScore } from '@/lib/spot/golfScore'
import { formatTemp1 } from '@/lib/utils/formatWeather'

export interface GolfHourlyRow {
  fcstYmd: string
  fcstHour: number
  temperature: number
  pop: number
  windSpeed: number
  feelsLikeC: number
  score: GolfScore
}

interface Props {
  hourly: GolfHourlyRow[]
  compact?: boolean
}

const BAR: Record<GolfScore['grade'], string> = {
  good: '#16a34a',
  fair: '#5B8DEE',
  caution: '#F59E0B',
  avoid: '#DC2626',
}

export function GolfHourlyTimeline({ hourly, compact = false }: Props) {
  if (!hourly.length) return null
  return (
    <div
      className={`rounded-2xl ${compact ? 'p-2.5' : 'p-3'}`}
      style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold px-1 mb-2" style={{ color: 'var(--primary)' }}>
        0~6시간 적합도
      </p>
      <div className={`flex gap-1.5 overflow-x-auto pb-1 ${compact ? '' : 'snap-x'}`}>
        {hourly.map((h, i) => {
          const c = BAR[h.score.grade]
          const w = Math.max(8, Math.round((h.score.score / 100) * 36))
          return (
            <div
              key={`${h.fcstYmd}-${h.fcstHour}-${i}`}
              className="flex-shrink-0 flex flex-col items-center rounded-xl px-2 py-2 snap-start"
              style={{
                width: compact ? 64 : 72,
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
                {String(h.fcstHour).padStart(2, '0')}시
              </span>
              <div
                className="mt-1 rounded-full"
                style={{ width: w, height: w, background: c, minHeight: 8, minWidth: 8 }}
                title={`${h.score.score}점`}
              />
              <span className="text-xs font-bold mt-1" style={{ color: 'var(--text)' }}>
                {formatTemp1(h.temperature)}°
              </span>
              <span className="text-[9px]" style={{ color: 'var(--humidity)' }}>
                POP {Math.round(h.pop)}%
              </span>
              <span className="text-[9px]" style={{ color: 'var(--muted)' }}>
                {h.windSpeed.toFixed(1)}m/s
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

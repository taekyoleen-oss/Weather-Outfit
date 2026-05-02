'use client'

import { formatTemp1 } from '@/lib/utils/formatWeather'
import type { PtyCode, SkyCode } from '@/types/weather'

export interface GolfHourlyRow {
  fcstYmd: string
  fcstHour: number
  temperature: number
  skyCode?: SkyCode
  ptyCode?: PtyCode
  pop: number
  precipitation?: number
  windSpeed: number
  feelsLikeC: number
  score: { score: number; grade: string }
}

interface Props {
  hourly: GolfHourlyRow[]
  compact?: boolean
}

function shortWeatherLabel(h: GolfHourlyRow): { icon: string; text: string } {
  if (h.ptyCode && h.ptyCode !== '0') {
    if (h.ptyCode === '1') return { icon: '🌧️', text: '비' }
    if (h.ptyCode === '2') return { icon: '🌨️', text: '비/눈' }
    if (h.ptyCode === '3') return { icon: '❄️', text: '눈' }
    if (h.ptyCode === '4') return { icon: '🌦️', text: '소나기' }
  }
  if (h.skyCode === '1') return { icon: '☀️', text: '맑음' }
  if (h.skyCode === '3') return { icon: '⛅', text: '구름' }
  if (h.skyCode === '4') return { icon: '☁️', text: '흐림' }
  if (h.pop >= 60) return { icon: '🌦️', text: '비 가능' }
  return { icon: '🌤️', text: '대체로 맑음' }
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
          const wx = shortWeatherLabel(h)
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
              <div className="mt-1 flex items-center gap-1">
                <span className="text-sm leading-none" aria-hidden>{wx.icon}</span>
                <span className="text-[10px] font-semibold leading-none" style={{ color: 'var(--text)' }}>
                  {wx.text}
                </span>
              </div>
              <span className="text-xs font-bold mt-1" style={{ color: 'var(--text)' }}>
                {formatTemp1(h.temperature)}°
              </span>
              <span className="text-[9px]" style={{ color: 'var(--humidity)' }}>
                강수확률 {Math.round(h.pop)}%
              </span>
              <span className="text-[9px]" style={{ color: 'var(--humidity)' }}>
                강수량 {h.precipitation != null && h.precipitation > 0 ? `${h.precipitation.toFixed(1)}mm` : '-'}
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

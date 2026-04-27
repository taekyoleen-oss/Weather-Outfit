'use client'

import type { HourlyForecast } from '@/types/weather'
import { weatherLabel } from '@/lib/utils/formatWeather'

interface Props {
  hourly: HourlyForecast[]
  currentHour: number
}

const WEATHER_EMOJI: Record<string, string> = {
  '맑음': '☀️',
  '구름 많음': '🌤',
  '흐림': '☁️',
  '비': '🌧',
  '비/눈': '🌨',
  '눈': '❄️',
  '소나기': '⛈',
}

export function HourlyWeatherStrip({ hourly, currentHour }: Props) {
  if (!hourly.length) {
    return (
      <div className="glass-card p-4">
        <div className="flex gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[52px]">
              <div className="h-3 w-10 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="h-4 w-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>
        시간별 예보
      </h3>
      <div className="scroll-strip flex gap-3 pb-2">
        {hourly.map((h, i) => {
          const hourNum = parseInt(h.time.split(':')[0], 10)
          const isCurrent = hourNum === currentHour
          const label = weatherLabel(h.skyCode, h.ptyCode)
          const emoji = WEATHER_EMOJI[label] ?? '🌤'

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 min-w-[52px] py-2 px-1 rounded-xl transition-colors"
              style={{
                background: isCurrent ? 'rgba(255,181,71,0.12)' : 'transparent',
                border: isCurrent ? '1px solid rgba(255,181,71,0.3)' : '1px solid transparent',
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: isCurrent ? 'var(--accent)' : 'var(--muted)' }}
              >
                {isCurrent ? '지금' : h.time.slice(0, 2) + '시'}
              </span>
              <span className="text-2xl">{emoji}</span>
              <span
                className="text-sm font-bold"
                style={{ color: 'var(--text)' }}
              >
                {Math.round(h.temperature)}°
              </span>
              {h.pop > 0 && (
                <span className="text-xs" style={{ color: 'var(--humidity)' }}>
                  {h.pop}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

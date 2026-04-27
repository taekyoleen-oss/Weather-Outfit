'use client'

import type { HourlyForecast } from '@/types/weather'
import { TIME_PERIODS, getPeriodIndex } from '@/lib/utils/timePeriods'
import { weatherLabel } from '@/lib/utils/formatWeather'

const WEATHER_EMOJI: Record<string, string> = {
  '맑음': '☀️',
  '구름 많음': '🌤',
  '흐림': '☁️',
  '비': '🌧',
  '비/눈': '🌨',
  '눈': '❄️',
  '소나기': '⛈',
}

interface Props {
  currentHour: number
  hourly: HourlyForecast[]
  selectedRepHour: number
  onSelect: (repHour: number) => void
}

export function TimePeriodPicker({ currentHour, hourly, selectedRepHour, onSelect }: Props) {
  const currentIdx = getPeriodIndex(currentHour)

  const chips = Array.from({ length: 5 }, (_, i) => {
    const rawIdx = currentIdx + i
    const idx = rawIdx % 5
    const isTomorrow = rawIdx >= 5
    const period = TIME_PERIODS[idx]
    const repHourStr = String(period.repHour).padStart(2, '0') + ':00'
    const entry = hourly.find((h) => h.time === repHourStr)
    const label = entry ? weatherLabel(entry.skyCode, entry.ptyCode) : null
    const weatherEmoji = label ? (WEATHER_EMOJI[label] ?? period.emoji) : period.emoji

    return {
      period,
      isTomorrow,
      isCurrent: i === 0,
      temperature: entry?.temperature,
      weatherEmoji,
      isSelected: selectedRepHour === period.repHour,
    }
  })

  return (
    <div className="glass-card p-3 sm:p-4">
      <h3 className="text-sm font-semibold mb-2.5" style={{ color: 'var(--muted)' }}>
        🕐 시간대 선택
      </h3>
      <div className="grid grid-cols-5 gap-1.5">
        {chips.map(({ period, isTomorrow, isCurrent, temperature, weatherEmoji, isSelected }) => (
          <button
            key={period.id + (isTomorrow ? '-t' : '')}
            onClick={() => onSelect(period.repHour)}
            className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all"
            style={{
              background: isSelected ? 'rgba(255,181,71,0.15)' : 'var(--surface)',
              border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
            }}
            aria-pressed={isSelected}
          >
            {/* Badge row — fixed height for alignment */}
            <div className="h-[16px] flex items-center">
              {isCurrent && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}
                >
                  지금
                </span>
              )}
              {isTomorrow && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--humidity)' }}
                >
                  내일
                </span>
              )}
            </div>

            {/* Weather emoji */}
            <span className="text-lg leading-none">{weatherEmoji}</span>

            {/* Period label */}
            <span
              className="text-[11px] font-semibold mt-0.5"
              style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}
            >
              {period.label}
            </span>

            {/* Temperature */}
            {temperature !== undefined ? (
              <span
                className="text-xs font-bold"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--muted)' }}
              >
                {Math.round(temperature)}°
              </span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                --
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

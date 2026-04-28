'use client'

import type { HourlyForecast } from '@/types/weather'
import { weatherLabel, formatTemp1 } from '@/lib/utils/formatWeather'
import { kstTodayYmd } from '@/lib/utils/timeOfDay'

interface Props {
  hourly: HourlyForecast[]
  currentHour: number
  selectedPeriodStart?: number
  selectedPeriodEnd?: number
  selectedDayOffset?: number
}

function ymdToUtcMidnight(ymd: string): number {
  return Date.UTC(
    parseInt(ymd.slice(0, 4), 10),
    parseInt(ymd.slice(4, 6), 10) - 1,
    parseInt(ymd.slice(6, 8), 10)
  )
}

/** 오늘(KST) 대비 슬롯 일자 — 오늘/내일/모레/글피/… */
function dayBannerLabel(todayYmd: string, slotYmd: string): string | null {
  const d = Math.round((ymdToUtcMidnight(slotYmd) - ymdToUtcMidnight(todayYmd)) / 86400000)
  if (d === 0) return '오늘'
  if (d < 0) return null
  if (d === 1) return '내일'
  if (d === 2) return '모레'
  if (d === 3) return '글피'
  return `${d}일 뒤`
}

function resolveSlotYmd(
  h: HourlyForecast,
  todayYmd: string,
  prevYmd: string | null,
  prevHour: number | null
): string {
  if (h.fcstDate) return h.fcstDate
  if (prevYmd === null) return todayYmd
  if (prevHour === null) return prevYmd
  const curH = parseInt(h.time.split(':')[0], 10)
  if (curH < prevHour) {
    const next = new Date(ymdToUtcMidnight(prevYmd) + 86400000)
    const y = next.getUTCFullYear()
    const m = String(next.getUTCMonth() + 1).padStart(2, '0')
    const d = String(next.getUTCDate()).padStart(2, '0')
    return `${y}${m}${d}`
  }
  return prevYmd
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

export function HourlyWeatherStrip({ hourly, currentHour, selectedPeriodStart, selectedPeriodEnd, selectedDayOffset = 0 }: Props) {
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

  const todayYmd = kstTodayYmd()
  const slotYmds: string[] = []
  let prevResolved: string | null = null
  let prevHour: number | null = null
  for (let i = 0; i < hourly.length; i++) {
    const ymd = resolveSlotYmd(hourly[i], todayYmd, prevResolved, prevHour)
    slotYmds.push(ymd)
    prevResolved = ymd
    prevHour = parseInt(hourly[i].time.split(':')[0], 10)
  }

  const selectedTargetYmd = (() => {
    const ms = ymdToUtcMidnight(todayYmd) + selectedDayOffset * 86400000
    const d = new Date(ms)
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
  })()

  return (
    <div className="glass-card p-3 sm:p-4">
      <h3 className="text-sm font-semibold mb-2.5" style={{ color: 'var(--muted)' }}>
        시간별 예보
      </h3>
      <div className="scroll-strip flex gap-1.5 sm:gap-2.5 pb-1">
        {hourly.map((h, i) => {
          const hourNum = parseInt(h.time.split(':')[0], 10)
          const slotYmd = slotYmds[i] ?? todayYmd
          const isCurrent = hourNum === currentHour && slotYmd === todayYmd
          const isInPeriod =
            selectedPeriodStart !== undefined &&
            selectedPeriodEnd !== undefined &&
            hourNum >= selectedPeriodStart &&
            hourNum <= selectedPeriodEnd &&
            slotYmd === selectedTargetYmd
          const label = weatherLabel(h.skyCode, h.ptyCode)
          const emoji = WEATHER_EMOJI[label] ?? '🌤'

          const prevYmd = i > 0 ? slotYmds[i - 1]! : null
          const showDayBanner = i === 0 ? dayBannerLabel(todayYmd, slotYmd) !== null : slotYmd !== prevYmd
          const dayBanner = showDayBanner ? dayBannerLabel(todayYmd, slotYmd) : null

          return (
            <div
              key={`${slotYmd}-${h.time}-${i}`}
              className="flex flex-col items-center gap-1 min-w-[42px] sm:min-w-[50px] py-1.5 px-0.5 rounded-xl transition-colors"
              style={{
                background: isCurrent
                  ? 'rgba(255,181,71,0.12)'
                  : isInPeriod
                  ? 'rgba(91,141,238,0.08)'
                  : 'transparent',
                border: isCurrent
                  ? '1px solid rgba(255,181,71,0.3)'
                  : isInPeriod
                  ? '1px solid rgba(91,141,238,0.2)'
                  : '1px solid transparent',
              }}
            >
              <div className="h-[14px] w-full flex items-center justify-center">
                {dayBanner ? (
                  <span
                    className="text-[8px] font-bold leading-none px-1 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background: 'rgba(91,141,238,0.12)',
                      color: 'var(--humidity)',
                    }}
                  >
                    {dayBanner}
                  </span>
                ) : (
                  <span className="text-[8px] select-none opacity-0" aria-hidden>
                    ·
                  </span>
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: isCurrent ? 'var(--accent)' : 'var(--muted)' }}
              >
                {isCurrent ? '지금' : h.time.slice(0, 2) + '시'}
              </span>
              <span className="text-xl">{emoji}</span>
              <span
                className="text-xs font-bold"
                style={{ color: 'var(--text)' }}
              >
                {formatTemp1(h.temperature)}°
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

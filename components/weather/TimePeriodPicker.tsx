'use client'

import type { HourlyForecast, SkyCode, PtyCode } from '@/types/weather'
import { TIME_PERIODS, getPeriodIndex } from '@/lib/utils/timePeriods'
import { weatherLabel, formatTemp1 } from '@/lib/utils/formatWeather'
import { addCalendarDaysFromKstYmd, kstTodayYmd } from '@/lib/utils/timeOfDay'

const WEATHER_EMOJI: Record<string, string> = {
  맑음: '☀️',
  '구름 많음': '🌤',
  흐림: '☁️',
  비: '🌧',
  '비/눈': '🌨',
  눈: '❄️',
  소나기: '⛈',
}

function emojiForHourAndLabel(
  hourNum: number,
  label: string | null,
  fallback: string,
  sunsetHm: number | null,
): string {
  if (!label) return fallback
  const slotHm = hourNum * 100
  const isNight =
    sunsetHm == null ? hourNum >= 19 || hourNum < 6 : slotHm > sunsetHm || hourNum < 6
  if (!isNight) return WEATHER_EMOJI[label] ?? fallback
  if (label === '맑음') return '🌙'
  if (label === '구름 많음') return '🌙☁️'
  return WEATHER_EMOJI[label] ?? fallback
}

function isNightByHour(hourNum: number, sunsetHm: number | null): boolean {
  const slotHm = hourNum * 100
  return sunsetHm == null ? hourNum >= 19 || hourNum < 6 : slotHm > sunsetHm || hourNum < 6
}

function sunsetHmFromText(sunsetTime?: string): number | null {
  if (!sunsetTime) return null
  const t = sunsetTime.trim()
  const compact = t.includes(':') ? t.replace(':', '') : t
  const hm = parseInt(compact, 10)
  return Number.isFinite(hm) ? hm : null
}

interface Props {
  currentHour: number
  currentConditions?: { temperature: number; skyCode: SkyCode; ptyCode: PtyCode } | null
  hourly: HourlyForecast[]
  selectedRepHour: number
  selectedDayOffset: number
  sunsetTime?: string
  onSelectPreset: (repHour: number, dayOffset: number) => void
}

function ymdToUtcMidnight(ymd: string): number {
  return Date.UTC(
    parseInt(ymd.slice(0, 4), 10),
    parseInt(ymd.slice(4, 6), 10) - 1,
    parseInt(ymd.slice(6, 8), 10),
  )
}

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(ymdToUtcMidnight(ymd) + days * 86400000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${dd}`
}

function resolveSlotYmd(
  h: HourlyForecast,
  todayYmd: string,
  prevYmd: string | null,
  prevHour: number | null,
): string {
  if (h.fcstDate) return h.fcstDate
  if (prevYmd === null) return todayYmd
  if (prevHour === null) return prevYmd
  const curH = parseInt(h.time.split(':')[0], 10)
  return curH < prevHour ? addDaysYmd(prevYmd, 1) : prevYmd
}

function findHourlyAtHour(
  hourNum: number,
  targetYmd: string,
  hourly: HourlyForecast[],
  slotYmds: string[],
): HourlyForecast | undefined {
  const timeStr = String(hourNum).padStart(2, '0') + ':00'
  const idx = hourly.findIndex((h, i) => h.time === timeStr && slotYmds[i] === targetYmd)
  return idx >= 0 ? hourly[idx] : undefined
}

export function TimePeriodPicker({
  currentHour,
  currentConditions,
  hourly,
  selectedRepHour,
  selectedDayOffset,
  sunsetTime,
  onSelectPreset,
}: Props) {
  const todayYmd = kstTodayYmd()
  const slotYmds: string[] = []
  let prevYmd: string | null = null
  let prevHour: number | null = null
  for (let i = 0; i < hourly.length; i++) {
    const ymd = resolveSlotYmd(hourly[i], todayYmd, prevYmd, prevHour)
    slotYmds.push(ymd)
    prevYmd = ymd
    prevHour = parseInt(hourly[i].time.split(':')[0], 10)
  }

  const periodCount = TIME_PERIODS.length
  const currentIdx = getPeriodIndex(currentHour)
  const curHourStr = String(currentHour).padStart(2, '0') + ':00'
  const sunsetHm = sunsetHmFromText(sunsetTime)

  function fallbackTempForNow(): number | undefined {
    const idx = hourly.findIndex((h, i) => h.time === curHourStr && slotYmds[i] === todayYmd)
    if (idx >= 0) return hourly[idx].temperature
    const toHour = (t: string) => parseInt(t.split(':')[0], 10)
    let best: number | undefined
    let bestHour = -1
    for (let i = 0; i < hourly.length; i++) {
      if (slotYmds[i] !== todayYmd) continue
      const h = toHour(hourly[i].time)
      if (h <= currentHour && h > bestHour) {
        bestHour = h
        best = hourly[i].temperature
      }
    }
    if (best !== undefined) return best
    return hourly[0]?.temperature
  }

  const chips = Array.from({ length: periodCount }, (_, i) => {
    const rawIdx = currentIdx + i
    const idx = rawIdx % periodCount
    const period = TIME_PERIODS[idx]
    const dayOffset = Math.floor(rawIdx / periodCount)
    const isTomorrow = dayOffset >= 1
    const targetYmd = addDaysYmd(todayYmd, dayOffset)
    const isCurrent = i === 0

    const displayHour = isCurrent ? currentHour : period.start
    const displayEntry = findHourlyAtHour(displayHour, targetYmd, hourly, slotYmds)
    const repFallback = findHourlyAtHour(period.repHour, targetYmd, hourly, slotYmds)
    const iconEntry = displayEntry ?? repFallback
    const label = iconEntry
      ? weatherLabel(iconEntry.skyCode, iconEntry.ptyCode)
      : isCurrent && currentConditions
        ? weatherLabel(currentConditions.skyCode, currentConditions.ptyCode)
        : null
    const isNight = isNightByHour(displayHour, sunsetHm)
    const weatherEmoji = emojiForHourAndLabel(displayHour, label, period.emoji, sunsetHm)

    let temperature: number | undefined
    if (isCurrent) {
      temperature = currentConditions?.temperature ?? fallbackTempForNow()
    } else {
      const atStart = findHourlyAtHour(period.start, targetYmd, hourly, slotYmds)
      temperature = atStart?.temperature
    }

    const isSelected = selectedRepHour === period.repHour && selectedDayOffset === dayOffset

    return {
      period,
      isTomorrow,
      dayOffset,
      isCurrent,
      temperature,
      weatherEmoji,
      isNight,
      isSelected,
    }
  })

  return (
    <div className="glass-card p-3 sm:p-4 max-lg:px-3.5 max-lg:pt-3.5 max-lg:pb-3.5">
      <h3
        className="text-sm max-lg:text-[15px] font-semibold mb-2.5 max-lg:mb-3 max-lg:tracking-tight"
        style={{ color: 'var(--muted)' }}
      >
        🕐 시간대 선택
      </h3>
      <div className="grid grid-cols-4 max-lg:grid-cols-2 gap-1.5">
        {chips.map(({ period, isTomorrow, dayOffset, isCurrent, temperature, weatherEmoji, isNight, isSelected }) => (
          <button
            key={period.id + (isTomorrow ? '-t' : '')}
            type="button"
            onClick={() => onSelectPreset(period.repHour, dayOffset)}
            className="flex flex-col items-center gap-0.5 max-lg:gap-1 py-2 px-1 rounded-lg transition-all"
            style={{
              background: isSelected ? 'var(--colors-canvas-light)' : 'var(--colors-surface-filter)',
              border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
            }}
            aria-pressed={isSelected}
          >
            <div className="h-[16px] flex items-center justify-center">
              {isCurrent && (
                <span
                  className="text-[9px] max-lg:text-[10px] px-1.5 max-lg:px-2 py-0.5 rounded-full font-semibold leading-none max-lg:tracking-wide"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}
                >
                  지금
                </span>
              )}
              {isTomorrow && (
                <span
                  className="text-[9px] max-lg:text-[10px] px-1.5 max-lg:px-2 py-0.5 rounded-full font-semibold leading-none max-lg:tracking-wide"
                  style={{ background: 'var(--primary-tint-10)', color: 'var(--humidity)' }}
                >
                  내일
                </span>
              )}
            </div>

            <div className="h-[20px] w-full flex items-center justify-center">
              {weatherEmoji === '🌙☁️' ? (
                <span
                  className="relative inline-block w-[24px] h-[20px]"
                  style={{
                    color: 'initial',
                    filter: isNight ? 'grayscale(1) saturate(0)' : 'none',
                    fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                    transform: 'translateY(1px)',
                  }}
                >
                  <span className="absolute left-0 top-[1px] text-lg max-lg:text-xl leading-none">🌙</span>
                  <span className="absolute left-[10px] top-[3px] text-base max-lg:text-lg leading-none">☁️</span>
                </span>
              ) : (
                <span
                  className="text-lg max-lg:text-xl leading-none inline-block whitespace-nowrap"
                  style={{
                    color: 'initial',
                    filter: isNight ? 'grayscale(1) saturate(0)' : 'none',
                    fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                    transform: 'translateY(1px)',
                  }}
                >
                  {weatherEmoji}
                </span>
              )}
            </div>

            <span
              className="text-[11px] max-lg:text-[13px] font-semibold mt-0.5 max-lg:mt-0 leading-tight max-lg:tracking-wide"
              style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}
            >
              {period.label}
            </span>

            {temperature !== undefined ? (
              <span
                className="text-xs max-lg:text-[13px] font-bold tabular-nums leading-none max-lg:mt-0.5"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--muted)' }}
              >
                {formatTemp1(temperature)}°
              </span>
            ) : (
              <span className="max-lg:text-[13px] max-lg:leading-none text-xs" style={{ color: 'var(--muted)' }}>
                --
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

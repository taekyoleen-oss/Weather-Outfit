'use client'

import type { HourlyForecast, SkyCode, PtyCode } from '@/types/weather'
import { TIME_PERIODS, getPeriodIndex } from '@/lib/utils/timePeriods'
import { weatherLabel, formatTemp1 } from '@/lib/utils/formatWeather'
import { kstTodayYmd } from '@/lib/utils/timeOfDay'

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
  /** 관측/초단기 현재기온 — '지금' 칩에만 사용 */
  currentConditions?: { temperature: number; skyCode: SkyCode; ptyCode: PtyCode } | null
  hourly: HourlyForecast[]
  selectedRepHour: number
  selectedDayOffset: number
  onSelect: (repHour: number, dayOffset: number) => void
}

function ymdToUtcMidnight(ymd: string): number {
  return Date.UTC(
    parseInt(ymd.slice(0, 4), 10),
    parseInt(ymd.slice(4, 6), 10) - 1,
    parseInt(ymd.slice(6, 8), 10)
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
  prevHour: number | null
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
  slotYmds: string[]
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
  onSelect,
}: Props) {
  const currentIdx = getPeriodIndex(currentHour)
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
  const curHourStr = String(currentHour).padStart(2, '0') + ':00'

  function fallbackTempForNow(): number | undefined {
    // 1) 가장 안정적: "오늘 + 현재시각 슬롯" (예: 18:00)
    const idx = hourly.findIndex((h, i) => h.time === curHourStr && slotYmds[i] === todayYmd)
    if (idx >= 0) return hourly[idx].temperature

    // 2) 오늘 슬롯 중, 현재시각 이하의 가장 최신값
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

    // 3) 그래도 없으면, 전체 중 첫 슬롯 (데이터 로딩 직후 최소 표시용)
    return hourly[0]?.temperature
  }

  const chips = Array.from({ length: periodCount }, (_, i) => {
    const rawIdx = currentIdx + i
    const idx = rawIdx % periodCount
    const period = TIME_PERIODS[idx]
    const dayOffset = Math.floor(rawIdx / periodCount)
    /** 다음날에 해당하는 칩(rawIdx≥periodCount)에는 각각 '내일' 배지 표시 */
    const isTomorrow = dayOffset >= 1
    const targetYmd = addDaysYmd(todayYmd, dayOffset)
    const isCurrent = i === 0

    /** 지금: 현재 시 정각 슬롯(날씨 아이콘) / 그 외: 구간 시작 시각(예: 오후 → 12시) */
    const displayHour = isCurrent ? currentHour : period.start
    const displayEntry = findHourlyAtHour(displayHour, targetYmd, hourly, slotYmds)
    const repFallback = findHourlyAtHour(period.repHour, targetYmd, hourly, slotYmds)
    const iconEntry = displayEntry ?? repFallback
    const label = iconEntry
      ? weatherLabel(iconEntry.skyCode, iconEntry.ptyCode)
      : isCurrent && currentConditions
        ? weatherLabel(currentConditions.skyCode, currentConditions.ptyCode)
        : null
    const weatherEmoji = label ? (WEATHER_EMOJI[label] ?? period.emoji) : period.emoji

    let temperature: number | undefined
    if (isCurrent) {
      temperature = currentConditions?.temperature ?? fallbackTempForNow()
    } else {
      const atStart = findHourlyAtHour(period.start, targetYmd, hourly, slotYmds)
      temperature = atStart?.temperature
    }

    return {
      period,
      isTomorrow,
      dayOffset,
      isCurrent,
      temperature,
      weatherEmoji,
      isSelected: selectedRepHour === period.repHour && selectedDayOffset === dayOffset,
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
      <div className="grid grid-cols-4 gap-1.5">
        {chips.map(({ period, isTomorrow, dayOffset, isCurrent, temperature, weatherEmoji, isSelected }) => (
          <button
            key={period.id + (isTomorrow ? '-t' : '')}
            onClick={() => onSelect(period.repHour, dayOffset)}
            className="flex flex-col items-center gap-0.5 max-lg:gap-1 py-2 px-1 rounded-xl transition-all"
            style={{
              background: isSelected ? 'rgba(255,181,71,0.15)' : 'var(--surface)',
              border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
            }}
            aria-pressed={isSelected}
          >
            {/* Badge row — fixed height for alignment */}
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
                  style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--humidity)' }}
                >
                  내일
                </span>
              )}
            </div>

            {/* Weather emoji */}
            <span className="text-lg max-lg:text-xl leading-none">{weatherEmoji}</span>

            {/* Period label */}
            <span
              className="text-[11px] max-lg:text-[13px] font-semibold mt-0.5 max-lg:mt-0 leading-tight max-lg:tracking-wide"
              style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}
            >
              {period.label}
            </span>

            {/* Temperature */}
            {temperature !== undefined ? (
              <span
                className="text-xs max-lg:text-[13px] font-bold tabular-nums leading-none max-lg:mt-0.5"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--muted)' }}
              >
                {formatTemp1(temperature)}°
              </span>
            ) : (
              <span
                className="max-lg:text-[13px] max-lg:leading-none text-xs"
                style={{ color: 'var(--muted)' }}
              >
                --
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

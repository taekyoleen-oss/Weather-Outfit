'use client'

import { useState, useEffect, useRef } from 'react'
import type { HourlyForecast, SkyCode, PtyCode } from '@/types/weather'
import { OUTFIT_PERIODS, getOutfitPeriodIndex } from '@/lib/utils/timePeriods'
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

function diffDaysYmd(fromYmd: string, toYmd: string): number {
  return Math.round((ymdToUtcMidnight(toYmd) - ymdToUtcMidnight(fromYmd)) / 86400000)
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

interface Props {
  currentHour: number
  currentConditions?: { temperature: number; skyCode: SkyCode; ptyCode: PtyCode } | null
  hourly: HourlyForecast[]
  selectedRepHour: number
  /** 복장·날씨 기준일(KST yyyymmdd). 칩 선택 표시는 달력 일자와 대표 시각으로 맞춘다 */
  selectedScheduleYmd: string
  sunsetTime?: string
  onSelectPreset: (repHour: number, dayOffset: number) => void
  /** 연속 시간대 범위 선택 시 끝 칩 정보 (단일 선택이면 start === end) */
  onRangeSelect?: (
    startRepHour: number,
    startDayOffset: number,
    endRepHour: number,
    endDayOffset: number,
  ) => void
}

/** 선택된 칩을 (OUTFIT_PERIODS 인덱스, 일자 오프셋) 쌍으로 표현 */
type SelectedChip = { periodIdx: number; dayOffset: number }

export function TimePeriodPicker({
  currentHour,
  currentConditions,
  hourly,
  selectedRepHour,
  selectedScheduleYmd,
  sunsetTime,
  onSelectPreset,
  onRangeSelect,
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

  const periodCount = OUTFIT_PERIODS.length
  const currentIdx = getOutfitPeriodIndex(currentHour)
  const curHourStr = String(currentHour).padStart(2, '0') + ':00'
  const sunsetHm = sunsetHmFromText(sunsetTime)

  const targetDayOffset = Math.max(0, diffDaysYmd(todayYmd, selectedScheduleYmd))
  const isFullDayMode = targetDayOffset > 0

  // ── 선택 상태: (periodIdx, dayOffset) 쌍 배열로 관리 ─────────────────────
  // currentIdx 변화에 독립적이므로 시간이 지나도 올바른 칩이 유지됨
  const [selectedChips, setSelectedChips] = useState<SelectedChip[]>(() => {
    const selPeriodIdx = getOutfitPeriodIndex(selectedRepHour)
    const selDayOffset = Math.max(0, diffDaysYmd(kstTodayYmd(), selectedScheduleYmd))
    return [{ periodIdx: selPeriodIdx, dayOffset: selDayOffset }]
  })

  // 내부 클릭으로 유발된 props 변경은 상태를 리셋하지 않도록 플래그 사용
  const internalUpdateRef = useRef(false)

  useEffect(() => {
    if (internalUpdateRef.current) {
      internalUpdateRef.current = false
      return
    }
    // 외부(위치 변경 등) 변화 → 단일 칩으로 리셋
    const selPeriodIdx = getOutfitPeriodIndex(selectedRepHour)
    const selDayOffset = Math.max(0, diffDaysYmd(todayYmd, selectedScheduleYmd))
    setSelectedChips([{ periodIdx: selPeriodIdx, dayOffset: selDayOffset }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepHour, selectedScheduleYmd])

  function chipOrder(c: SelectedChip) {
    return c.dayOffset * periodCount + c.periodIdx
  }

  function sameChip(a: SelectedChip, b: SelectedChip) {
    return a.periodIdx === b.periodIdx && a.dayOffset === b.dayOffset
  }

  function isChipSelected(periodIdx: number, dayOffset: number) {
    return selectedChips.some((c) => c.periodIdx === periodIdx && c.dayOffset === dayOffset)
  }

  function handleChipClick(periodIdx: number, dayOffset: number) {
    const clickedChip: SelectedChip = { periodIdx, dayOffset }
    const clickedOrder = chipOrder(clickedChip)
    const sorted = [...selectedChips].sort((a, b) => chipOrder(a) - chipOrder(b))
    const minOrder = chipOrder(sorted[0]!)
    const maxOrder = chipOrder(sorted[sorted.length - 1]!)

    let newSel: SelectedChip[]
    if (sorted.some((c) => sameChip(c, clickedChip))) {
      // 이미 선택된 칩 클릭: 범위 축소
      if (sorted.length === 1) return // 마지막 칩은 해제 불가
      if (clickedOrder === minOrder) {
        newSel = sorted.slice(1)          // 첫 칩 제거
      } else if (clickedOrder === maxOrder) {
        newSel = sorted.slice(0, -1)      // 마지막 칩 제거
      } else {
        newSel = [clickedChip]            // 중간 칩: 해당 칩만 남김
      }
    } else if (clickedOrder === minOrder - 1 || clickedOrder === maxOrder + 1) {
      // 인접한 칩: 범위 확장
      newSel = [...sorted, clickedChip].sort((a, b) => chipOrder(a) - chipOrder(b))
    } else {
      // 비연속 칩: 새로 단일 선택
      newSel = [clickedChip]
    }

    setSelectedChips(newSel)

    const firstChip = newSel[0]!
    const lastChip = newSel[newSel.length - 1]!
    const firstPeriod = OUTFIT_PERIODS[firstChip.periodIdx]!
    const lastPeriod = OUTFIT_PERIODS[lastChip.periodIdx]!

    internalUpdateRef.current = true
    onSelectPreset(firstPeriod.repHour, firstChip.dayOffset)
    onRangeSelect?.(firstPeriod.repHour, firstChip.dayOffset, lastPeriod.repHour, lastChip.dayOffset)
  }

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

  // 풀데이 모드: 미래 날짜 선택 시 새벽부터 7개 시간대 전부 표시
  const chips = isFullDayMode
    ? OUTFIT_PERIODS.map((period, idx) => {
        const displayHour = period.start
        const iconEntry =
          findHourlyAtHour(displayHour, selectedScheduleYmd, hourly, slotYmds) ??
          findHourlyAtHour(period.repHour, selectedScheduleYmd, hourly, slotYmds)
        const label = iconEntry ? weatherLabel(iconEntry.skyCode, iconEntry.ptyCode) : null
        const isNight = isNightByHour(displayHour, sunsetHm)
        const weatherEmoji = emojiForHourAndLabel(displayHour, label, period.emoji, sunsetHm)
        const temperature = findHourlyAtHour(period.start, selectedScheduleYmd, hourly, slotYmds)?.temperature
        const endTemperature = findHourlyAtHour(period.end, selectedScheduleYmd, hourly, slotYmds)?.temperature

        // 첫 번째 칩에만 날짜 배지 표시
        const fullDayLabel: string | null = idx === 0
          ? (targetDayOffset === 1 ? '내일'
              : targetDayOffset === 2 ? '모레'
              : `${selectedScheduleYmd.slice(4, 6)}/${selectedScheduleYmd.slice(6, 8)}`)
          : null

        return {
          period, idx,
          isTomorrow: false,
          dayOffset: targetDayOffset,
          isCurrent: false,
          temperature, endTemperature, weatherEmoji, isNight,
          isSelected: isChipSelected(idx, targetDayOffset),
          fullDayLabel,
        }
      })
    : Array.from({ length: periodCount }, (_, i) => {
        const rawIdx = currentIdx + i
        const idx = rawIdx % periodCount
        const period = OUTFIT_PERIODS[idx]!
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
        const endTemperature = findHourlyAtHour(period.end, targetYmd, hourly, slotYmds)?.temperature

        return {
          period, idx, isTomorrow, dayOffset, isCurrent,
          temperature, endTemperature, weatherEmoji, isNight,
          isSelected: isChipSelected(idx, dayOffset),
          fullDayLabel: null as string | null,
        }
      })

  // 선택된 칩 중 첫/마지막 시각적 위치 (연결 표시용)
  const selectedVisualPositions = chips
    .map((c, i) => (c.isSelected ? i : -1))
    .filter((i) => i >= 0)
  const selMin = selectedVisualPositions[0] ?? -1
  const selMax = selectedVisualPositions[selectedVisualPositions.length - 1] ?? -1

  return (
    <div className="glass-card p-3 sm:p-4 max-lg:px-3.5 max-lg:pt-3.5 max-lg:pb-3.5">
      <h3
        className="text-sm max-lg:text-[15px] font-semibold mb-2.5 max-lg:mb-3 max-lg:tracking-tight"
        style={{ color: 'var(--muted)' }}
      >
        🕐{' '}
        {isFullDayMode
          ? `${selectedScheduleYmd.slice(0, 4)}년 ${parseInt(selectedScheduleYmd.slice(4, 6), 10)}월 ${parseInt(selectedScheduleYmd.slice(6, 8), 10)}일 시간대`
          : '시간대 선택'}
      </h3>
      <div className="flex flex-nowrap gap-1 overflow-x-auto pb-0.5">
        {chips.map(({ period, idx, isTomorrow, dayOffset, isCurrent, temperature, endTemperature, weatherEmoji, isNight, isSelected, fullDayLabel }, visualPos) => {
          const isRangeStart = isSelected && visualPos === selMin
          const isRangeEnd = isSelected && visualPos === selMax
          const isRangeMiddle = isSelected && !isRangeStart && !isRangeEnd

          return (
            <button
              key={period.id + (isTomorrow ? '-t' : '')}
              type="button"
              onClick={() => handleChipClick(idx, dayOffset)}
              className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-all flex-1 min-w-[68px] flex-shrink-0"
              style={{
                background: isSelected ? 'var(--colors-canvas-light)' : 'var(--colors-surface-filter)',
                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                // 연속 선택 범위: 중간 칩은 좌우 경계선을 흐리게 해 연결감 표현
                ...(isRangeMiddle
                  ? { borderLeftColor: 'rgba(91,141,238,0.35)', borderRightColor: 'rgba(91,141,238,0.35)' }
                  : {}),
                ...(isRangeStart && selMax > selMin
                  ? { borderRightColor: 'rgba(91,141,238,0.35)' }
                  : {}),
                ...(isRangeEnd && selMax > selMin
                  ? { borderLeftColor: 'rgba(91,141,238,0.35)' }
                  : {}),
              }}
              aria-pressed={isSelected}
            >
              <div className="h-[14px] flex items-center justify-center">
                {isCurrent && (
                  <span
                    className="text-[8px] px-1 py-0.5 rounded-full font-semibold leading-none"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}
                  >
                    지금
                  </span>
                )}
                {isTomorrow && (
                  <span
                    className="text-[8px] px-1 py-0.5 rounded-full font-semibold leading-none"
                    style={{ background: 'var(--primary-tint-10)', color: 'var(--humidity)' }}
                  >
                    내일
                  </span>
                )}
                {fullDayLabel && (
                  <span
                    className="text-[8px] px-1 py-0.5 rounded-full font-semibold leading-none"
                    style={{ background: 'var(--primary-tint-10)', color: 'var(--humidity)' }}
                  >
                    {fullDayLabel}
                  </span>
                )}
              </div>

              <div className="h-[18px] w-full flex items-center justify-center">
                {weatherEmoji === '🌙☁️' ? (
                  <span
                    className="relative inline-block w-[22px] h-[18px]"
                    style={{
                      color: 'initial',
                      filter: isNight ? 'grayscale(1) saturate(0)' : 'none',
                      fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                      transform: 'translateY(1px)',
                    }}
                  >
                    <span className="absolute left-0 top-[1px] text-base leading-none">🌙</span>
                    <span className="absolute left-[9px] top-[2px] text-sm leading-none">☁️</span>
                  </span>
                ) : (
                  <span
                    className="text-base leading-none inline-block whitespace-nowrap"
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
                className="text-[10px] font-semibold mt-0.5 leading-tight whitespace-nowrap"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}
              >
                {period.label}
              </span>

              {temperature !== undefined ? (
                <span
                  className="text-[9px] font-bold tabular-nums leading-none whitespace-nowrap"
                  style={{ color: isSelected ? 'var(--accent)' : 'var(--muted)' }}
                >
                  {Math.round(temperature)}°{endTemperature !== undefined && Math.round(endTemperature) !== Math.round(temperature) ? `~${Math.round(endTemperature)}°` : ''}
                </span>
              ) : (
                <span className="text-[9px] leading-none" style={{ color: 'var(--muted)' }}>
                  --
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

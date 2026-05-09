'use client'

import type { HourlyForecast } from '@/types/weather'
import { weatherLabel, formatTemp1 } from '@/lib/utils/formatWeather'
import { addCalendarDaysFromKstYmd, kstTodayYmd } from '@/lib/utils/timeOfDay'
import { NightCloudyIcon } from './NightCloudyIcon'

interface Props {
  hourly: HourlyForecast[]
  currentHour: number
  selectedPeriodStart?: number
  selectedPeriodEnd?: number
  /** 오늘(KST) 기준 일수 오프셋 — `highlightTargetYmd`가 없을 때만 사용 */
  selectedDayOffset?: number
  /** 있으면 이 yyyymmdd에 맞춰 구간 하이라이트(오프셋보다 우선) */
  highlightTargetYmd?: string
  /** true면 `highlightTargetYmd`가 아닌 날의 슬롯을 흐리게 */
  fadeNonMatchingTargetYmd?: boolean
  sunsetTime?: string
  /** 시간별 적합도 색상 바 — 키: "${yyyymmdd}-${hour}" */
  suitabilityByHour?: Record<string, { score: number; grade: string }>
}

function ymdToUtcMidnight(ymd: string): number {
  return Date.UTC(
    parseInt(ymd.slice(0, 4), 10),
    parseInt(ymd.slice(4, 6), 10) - 1,
    parseInt(ymd.slice(6, 8), 10)
  )
}

/** 오늘(KST) 대비 슬롯 일자 — 현재/내일/모레/글피/… */
function dayBannerLabel(todayYmd: string, slotYmd: string): string | null {
  const d = Math.round((ymdToUtcMidnight(slotYmd) - ymdToUtcMidnight(todayYmd)) / 86400000)
  if (d === 0) return '현재'
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

function sunsetHmFromText(sunsetTime?: string): number | null {
  if (!sunsetTime) return null
  const t = sunsetTime.trim()
  // "1845" or "18:45" 모두 지원
  const compact = t.includes(':') ? t.replace(':', '') : t
  const hm = parseInt(compact, 10)
  return Number.isFinite(hm) ? hm : null
}

function suitabilityColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#eab308'
  return '#ef4444'
}

export function HourlyWeatherStrip({
  hourly,
  currentHour,
  selectedPeriodStart,
  selectedPeriodEnd,
  selectedDayOffset = 0,
  highlightTargetYmd,
  fadeNonMatchingTargetYmd = false,
  sunsetTime,
  suitabilityByHour,
}: Props) {
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

  // 모든 날짜 항목을 연속으로 표시 (날짜별 필터링 없음)
  const activeEntries: { h: HourlyForecast; ymd: string }[] = hourly
    .map((h, i) => ({ h, ymd: slotYmds[i] ?? todayYmd }))

  const selectedTargetYmd =
    highlightTargetYmd ??
    (() => {
      const ms = ymdToUtcMidnight(todayYmd) + selectedDayOffset * 86400000
      const d = new Date(ms)
      return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
    })()

  const nextTargetYmd = addCalendarDaysFromKstYmd(selectedTargetYmd, 1)
  const sunsetHm = sunsetHmFromText(sunsetTime)

  const hasAnySlotForTarget =
    highlightTargetYmd == null
      ? true
      : slotYmds.some((y) => y === highlightTargetYmd)

  return (
    <div
      className="glass-card wf-hourly-strip p-3 sm:p-4"
      style={
        fadeNonMatchingTargetYmd && highlightTargetYmd && !hasAnySlotForTarget
          ? { opacity: 0.45 }
          : undefined
      }
    >
      <div className="flex items-center mb-2.5">
        <h3 className="text-base font-semibold" style={{ color: 'var(--muted)' }}>
          시간별 예보
        </h3>
      </div>
      <div className="flex gap-0.5 sm:gap-1 pb-1">
        {/* 좌측 고정 라벨 열 */}
        <div className="grid grid-rows-[14px_14px_20px_14px_14px_14px_14px_14px] min-w-[46px] sm:min-w-[54px] py-1.5 px-1 rounded-xl bg-white/35">
          {/* 배너/시간/기온 행은 비워서 높이만 맞춤 */}
          <div className="h-[14px] w-full" />
          <div className="h-[14px] flex items-center">
            <span className="text-[10px] leading-none select-none opacity-0" aria-hidden>시간</span>
          </div>
          <div className="h-[20px] flex items-center">
            <span className="text-[10px] leading-none select-none opacity-0" aria-hidden>아이콘</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="text-[10px] leading-none select-none opacity-0" aria-hidden>기온</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>강수(%)</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>강수량(mm)</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>습도(%)</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>바람(m/s)</span>
          </div>
        </div>

        <div className="scroll-strip flex gap-1.5 sm:gap-2.5">
          {activeEntries.map(({ h, ymd: slotYmd }, idx) => {
            const hourNum = parseInt(h.time.split(':')[0], 10)
            const isCurrent = hourNum === currentHour && slotYmd === todayYmd
            const isInPeriod = (() => {
              if (selectedPeriodStart === undefined || selectedPeriodEnd === undefined) return false
              const s = selectedPeriodStart
              const e = selectedPeriodEnd
              if (s <= e) {
                return hourNum >= s && hourNum <= e && slotYmd === selectedTargetYmd
              }
              return (
                (slotYmd === selectedTargetYmd && hourNum >= s) ||
                (slotYmd === nextTargetYmd && hourNum <= e)
              )
            })()
            const prevYmd = idx > 0 ? activeEntries[idx - 1]!.ymd : null
            const showDayBanner = idx === 0 ? dayBannerLabel(todayYmd, slotYmd) !== null : slotYmd !== prevYmd
            const dayBanner = showDayBanner ? dayBannerLabel(todayYmd, slotYmd) : null
            const dayChanged = idx > 0 && slotYmd !== prevYmd
            const fadeThisSlot =
              fadeNonMatchingTargetYmd &&
              !!highlightTargetYmd &&
              slotYmd !== highlightTargetYmd
            const label = weatherLabel(h.skyCode, h.ptyCode)
            const slotHm = hourNum * 100
            const isNight =
              sunsetHm == null ? (hourNum >= 19 || hourNum < 6) : (slotHm > sunsetHm || hourNum < 6)
            const isNightCloudy = isNight && label === '구름 많음'
            const baseEmoji = WEATHER_EMOJI[label] ?? '🌤'
            const emoji =
              isNight && label === '맑음'
                ? '🌙'
                : isNightCloudy
                ? '🌙'
                : baseEmoji
            return (
            <div key={`${slotYmd}-${h.time}-${idx}`} className="relative">
              {dayChanged && (
                <span
                  className="absolute -left-1 top-1 bottom-1 w-px"
                  style={{ background: 'var(--border)' }}
                  aria-hidden
                />
              )}
            {(() => {
              const suKey = `${slotYmd}-${hourNum}`
              const suit = suitabilityByHour?.[suKey]
              return (
            <div
              className="grid grid-rows-[14px_14px_20px_14px_14px_14px_14px_14px] items-center min-w-[52px] sm:min-w-[58px] py-1.5 px-1 rounded-xl transition-colors text-center relative overflow-hidden"
              style={{
                opacity: fadeThisSlot ? 0.4 : 1,
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
              {suit && (
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{ height: 3, background: suitabilityColor(suit.score) }}
                  aria-hidden
                />
              )}
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
                className="h-[14px] flex items-center justify-center text-xs font-medium"
                style={{ color: isCurrent ? 'var(--accent)' : 'var(--muted)' }}
              >
                {isCurrent ? '지금' : h.time.slice(0, 2) + '시'}
              </span>
              {isNightCloudy ? (
                <span className="h-[20px] flex items-center justify-center">
                  <NightCloudyIcon size={53} />
                </span>
              ) : (
                <span
                  className="h-[20px] flex items-center justify-center text-xl leading-none"
                  style={{
                    color: isNight ? '#94A3B8' : 'initial',
                    filter: isNight ? 'grayscale(1) saturate(0)' : 'none',
                    fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                  }}
                >
                  {emoji}
                </span>
              )}
              <span
                className="h-[14px] flex items-center justify-center text-xs font-bold"
                style={{ color: 'var(--text)' }}
              >
                {formatTemp1(h.temperature)}°
              </span>
              <span className="h-[14px] flex items-center justify-center" style={{ fontSize: 11, color: 'var(--humidity)' }}>{h.pop > 0 ? h.pop : '-'}</span>
              <span className="h-[14px] flex items-center justify-center" style={{ fontSize: 11, color: 'var(--humidity)' }}>{h.precipitation > 0 ? h.precipitation.toFixed(1) : '-'}</span>
              <span className="h-[14px] flex items-center justify-center" style={{ fontSize: 11, color: 'var(--muted)' }}>{Math.round(h.humidity)}</span>
              <span className="h-[14px] flex items-center justify-center" style={{ fontSize: 11, color: 'var(--muted)' }}>{h.windSpeed.toFixed(1)}</span>
            </div>
              )
            })()}
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

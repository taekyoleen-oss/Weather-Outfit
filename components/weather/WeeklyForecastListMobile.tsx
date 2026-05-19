'use client'

import Image from 'next/image'
import type { DailyForecast, SkyCode, PtyCode, SunriseSunset } from '@/types/weather'
import { pickIllustKey, illustFile } from '@/lib/utils/formatWeather'

interface Props {
  /** 오늘 포함 최대 8일치 일별 예보 (`mergeWeeklyDailyFromToday` 결과 권장) */
  daily: DailyForecast[]
  /** 헤더에 표시할 위치 이름 (옵션) */
  locationName?: string
  /** 오늘 행에 표시할 일출·일몰 (옵션) */
  sunriseSunset?: SunriseSunset | null
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function dayLabel(dateStr: string): string {
  const y = parseInt(dateStr.slice(0, 4), 10)
  const mo = parseInt(dateStr.slice(4, 6), 10) - 1
  const d = parseInt(dateStr.slice(6, 8), 10)
  const utc = new Date(Date.UTC(y, mo, d, 12, 0, 0))
  return DAY_LABELS[utc.getUTCDay()] ?? ''
}

function dayOfWeekIdx(dateStr: string): number {
  const y = parseInt(dateStr.slice(0, 4), 10)
  const mo = parseInt(dateStr.slice(4, 6), 10) - 1
  const d = parseInt(dateStr.slice(6, 8), 10)
  return new Date(Date.UTC(y, mo, d, 12, 0, 0)).getUTCDay()
}

function mmdd(dateStr: string): string {
  return `${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`
}

function rowLeftLabel(dateStr: string, idx: number): string {
  if (idx === 0) return '오늘'
  if (idx === 1) return '내일'
  if (idx === 2) return '모레'
  return dayLabel(dateStr)
}

/** 토(파랑) / 일(빨강) 강조 색 */
function dayLabelColor(dateStr: string, idx: number): string {
  const dow = dayOfWeekIdx(dateStr)
  if (dow === 0) return '#dc2626'
  if (dow === 6) return '#1d4ed8'
  // 오늘/내일/모레는 기본 강조색, 나머지는 기본 텍스트
  return idx <= 2 ? 'var(--text)' : 'var(--text)'
}

function iconSrc(sky?: SkyCode, pty?: PtyCode, period: 'morning' | 'day' = 'day'): string {
  const key = pickIllustKey(sky ?? '3', pty ?? '0')
  return `/illust/weather/${illustFile(key, period)}.svg`
}

function formatHm(hmRaw?: string): string {
  if (!hmRaw) return ''
  const compact = hmRaw.includes(':') ? hmRaw.replace(':', '') : hmRaw
  const n = parseInt(compact, 10)
  if (!Number.isFinite(n)) return ''
  const hh = Math.floor(n / 100)
  const mm = n % 100
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function PopText({ pop }: { pop?: number }) {
  if (pop == null || !Number.isFinite(pop)) return <span className="text-[11px]" style={{ color: 'var(--muted)' }}>—</span>
  return (
    <span className="text-[13px] font-semibold tabular-nums" style={{ color: '#1d4ed8' }}>
      {Math.round(pop)}%
    </span>
  )
}

/**
 * Apple Weather 스타일 「최저~최고 기온 범위 바」
 * 전체 너비는 주간 overall min~max 폭, 색은 파랑(차가움)→빨강(더움), 강조된 세그먼트가 해당 일자 범위.
 */
function RangeBar({ dayMin, dayMax, weekMin, weekMax }: { dayMin: number; dayMax: number; weekMin: number; weekMax: number }) {
  const span = Math.max(1, weekMax - weekMin)
  const startPct = ((dayMin - weekMin) / span) * 100
  const endPct = ((dayMax - weekMin) / span) * 100
  const widthPct = Math.max(8, endPct - startPct)
  return (
    <div
      className="relative h-1.5 rounded-full overflow-hidden"
      style={{ width: 84, background: 'rgba(120,113,108,0.18)' }}
      aria-label={`최저 ${Math.round(dayMin)}도 최고 ${Math.round(dayMax)}도`}
    >
      <div
        className="absolute top-0 bottom-0 rounded-full"
        style={{
          left: `${startPct}%`,
          width: `${widthPct}%`,
          background: 'linear-gradient(90deg, #3b82f6 0%, #f59e0b 60%, #ef4444 100%)',
        }}
      />
    </div>
  )
}

export function WeeklyForecastListMobile({ daily, locationName, sunriseSunset }: Props) {
  const rows: (DailyForecast | null)[] = []
  for (let i = 0; i < 8; i++) {
    rows.push(daily[i] ?? null)
  }

  // 주간 overall min/max (range bar 기준)
  const validDays = daily.filter((d) => Number.isFinite(d.minTemp) && Number.isFinite(d.maxTemp))
  const weekMin = validDays.length > 0 ? Math.min(...validDays.map((d) => d.minTemp)) : 0
  const weekMax = validDays.length > 0 ? Math.max(...validDays.map((d) => d.maxTemp)) : 1

  const sunriseHm = formatHm(sunriseSunset?.sunrise)
  const sunsetHm = formatHm(sunriseSunset?.sunset)

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--surface-border)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
          {locationName ? `${locationName} 주간예보` : '주간예보'}
        </h3>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ background: 'var(--colors-surface-filter)', color: 'var(--muted)' }}
          title="기상청 단기예보(오늘~+2일)와 중기예보(+3~+7일)를 결합한 8일 예보. 오전(07~12시)·오후(13~18시) 강수확률 분리 표시."
        >
          ⓘ
        </span>
      </div>
      <ul className="divide-y" style={{ borderColor: 'var(--surface-border)' }}>
        {rows.map((d, idx) => {
          if (!d) {
            return (
              <li
                key={`placeholder-${idx}`}
                className="grid grid-cols-[88px_1fr_1fr_120px] items-center gap-2 px-4 py-3 opacity-50"
              >
                <span className="text-[12px]" style={{ color: 'var(--muted)' }}>—</span>
                <span />
                <span />
                <span className="text-right text-[12px]" style={{ color: 'var(--muted)' }}>—</span>
              </li>
            )
          }
          const left = rowLeftLabel(d.date, idx)
          const amSky = d.amSkyCode ?? d.skyCode
          const amPty = d.amPtyCode ?? d.ptyCode
          const pmSky = d.pmSkyCode ?? d.skyCode
          const pmPty = d.pmPtyCode ?? d.ptyCode
          const isToday = idx === 0
          const isTomorrow = idx === 1
          const isDayAfter = idx === 2
          const labelColor = dayLabelColor(d.date, idx)
          return (
            <li
              key={d.date}
              className="grid grid-cols-[88px_1fr_1fr_120px] items-center gap-2 px-4 py-2.5"
            >
              {/* 좌: 요일/날짜 + 「내일/모레」 배지 */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold" style={{ color: labelColor }}>{left}</span>
                  <span className="text-[10px] tabular-nums" style={{ color: 'var(--muted)' }}>{mmdd(d.date)}</span>
                </div>
                {(isTomorrow || isDayAfter) && (
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0 rounded-full mt-0.5 self-start"
                    style={{ background: 'var(--primary-tint-12)', color: 'var(--primary)' }}
                  >
                    {isTomorrow ? '내일' : '모레'}
                  </span>
                )}
                {isToday && sunriseHm && sunsetHm && (
                  <span className="text-[9px] tabular-nums mt-0.5" style={{ color: 'var(--muted)' }}>
                    🌅 {sunriseHm} · 🌇 {sunsetHm}
                  </span>
                )}
              </div>

              {/* 오전 */}
              <div className="flex items-center justify-center gap-2">
                <PopText pop={d.amPop} />
                <Image
                  src={iconSrc(amSky, amPty, 'morning')}
                  alt={`오전 ${amPty !== '0' ? '강수' : '하늘'}`}
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0"
                />
              </div>

              {/* 오후 */}
              <div className="flex items-center justify-center gap-2">
                <Image
                  src={iconSrc(pmSky, pmPty, 'day')}
                  alt={`오후 ${pmPty !== '0' ? '강수' : '하늘'}`}
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0"
                />
                <PopText pop={d.pmPop} />
              </div>

              {/* 우: 최저/최고 + 범위 바 */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tabular-nums" style={{ color: '#1d4ed8' }}>{Math.round(d.minTemp)}°</span>
                  <RangeBar dayMin={d.minTemp} dayMax={d.maxTemp} weekMin={weekMin} weekMax={weekMax} />
                  <span className="text-xs font-bold tabular-nums" style={{ color: '#dc2626' }}>{Math.round(d.maxTemp)}°</span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

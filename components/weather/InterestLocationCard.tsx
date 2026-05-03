'use client'

import { useMemo, useEffect } from 'react'
import type { CurrentWeather, HourlyForecast, DailyForecast, WeatherAlert } from '@/types/weather'
import type { LocationInfo } from '@/types/location'
import {
  weatherLabel,
  weatherEmojiFromLabel,
  feelsLike,
  windDirectionLabel,
} from '@/lib/utils/formatWeather'
import { kstTodayYmd, addCalendarDaysFromKstYmd } from '@/lib/utils/timeOfDay'
import type { VisitSchedule } from '@/lib/utils/visitSchedule'
import { HourlyWeatherStrip } from './HourlyWeatherStrip'
import { CompactLocationBar } from './CompactLocationBar'
import { buildHourlySlotYmds } from '@/lib/utils/resolveHourlyForPeriod'

interface Props {
  weather: CurrentWeather | null
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  alerts: WeatherAlert[]
  location: LocationInfo
  currentHour: number
  loading?: boolean
  schedule: VisitSchedule
  onScheduleChange: (s: VisitSchedule) => void
  pinnedLocation: LocationInfo | null
  onLocationSelect: (loc: LocationInfo) => void
  /** false면 상단 헤더에서 검색할 때 — 카드 내 CompactLocationBar·GPS 숨김 */
  showLocationBar?: boolean
  /** GPS로 관심지역·일정을 현재 위치/시간으로 맞출 때(탭1과 로딩 공유) */
  gpsLoading?: boolean
  onUseCurrentLocation?: () => void
}

const DAY_KOR = ['일', '월', '화', '수', '목', '금', '토']

function dayLabel(dateStr: string, todayYmd: string): string {
  const diff = dateStrDiff(dateStr, todayYmd)
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff === 2) return '모레'
  const y = parseInt(dateStr.slice(0, 4), 10)
  const mo = parseInt(dateStr.slice(4, 6), 10) - 1
  const d = parseInt(dateStr.slice(6, 8), 10)
  return DAY_KOR[new Date(Date.UTC(y, mo, d, 12)).getUTCDay()] ?? '?'
}

function dateStrDiff(a: string, b: string): number {
  const ms = (s: string) =>
    Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), 12)
  return Math.round((ms(a) - ms(b)) / 86400000)
}

function mmdd(dateStr: string) {
  return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
}

function fmt(t: number) {
  return `${Math.round(t)}°`
}

function ymdToDateInput(ymd: string): string {
  if (ymd.length !== 8) return ''
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

function dateInputToYmd(iso: string): string {
  return iso.replace(/-/g, '')
}

function computeForecastYmdMax(todayYmd: string, daily: DailyForecast[], hourly: HourlyForecast[]): string {
  let max = todayYmd
  for (const d of daily) {
    if (d.date?.length === 8 && d.date > max) max = d.date
  }
  for (const h of hourly) {
    if (h.fcstDate?.length === 8 && h.fcstDate > max) max = h.fcstDate
  }
  const cap = addCalendarDaysFromKstYmd(todayYmd, 14)
  return max > cap ? cap : max
}

function clampYmd(ymd: string, minY: string, maxY: string): string {
  if (ymd < minY) return minY
  if (ymd > maxY) return maxY
  return ymd
}

function syntheticFromDaily(d: DailyForecast, base: CurrentWeather): CurrentWeather {
  const mid = Math.round((d.minTemp + d.maxTemp) / 2)
  return {
    ...base,
    temperature: mid,
    feelsLike: feelsLike(mid, base.windSpeed, base.humidity),
    skyCode: d.skyCode,
    ptyCode: d.ptyCode,
    basisDateKst: d.date,
  }
}

function hourlyToCurrent(entry: HourlyForecast, base: CurrentWeather): CurrentWeather {
  return {
    ...base,
    temperature: entry.temperature,
    feelsLike: feelsLike(entry.temperature, entry.windSpeed, entry.humidity),
    humidity: entry.humidity,
    windSpeed: entry.windSpeed,
    skyCode: entry.skyCode,
    ptyCode: entry.ptyCode,
    precipitation: entry.precipitation,
    uvIndex: base.uvIndex,
    basisDateKst: entry.fcstDate ?? base.basisDateKst,
  }
}

/** 해당 달력일의 시간별 슬롯 하나(가능하면 12시 근처) */
function pickHourlyForVisitDay(
  hourly: HourlyForecast[],
  visitYmd: string,
  todayYmd: string,
): HourlyForecast | null {
  if (!hourly.length) return null
  const slotYmds = buildHourlySlotYmds(hourly, todayYmd)
  const indices: number[] = []
  for (let i = 0; i < slotYmds.length; i++) {
    if (slotYmds[i] === visitYmd) indices.push(i)
  }
  if (!indices.length) return null
  const at12 = indices.find((i) => hourly[i].time.startsWith('12:'))
  const pick = at12 ?? indices[Math.floor(indices.length / 2)]!
  return hourly[pick] ?? null
}

export function InterestLocationCard({
  weather,
  hourly,
  daily,
  alerts,
  location,
  currentHour,
  loading,
  schedule,
  onScheduleChange,
  pinnedLocation,
  onLocationSelect,
  showLocationBar = true,
  gpsLoading = false,
  onUseCurrentLocation,
}: Props) {
  const todayYmd = kstTodayYmd()
  const visitYmd = schedule.visitDateYmd

  const { dateMin, dateMax } = useMemo(() => {
    const max = computeForecastYmdMax(todayYmd, daily, hourly)
    return { dateMin: todayYmd, dateMax: max }
  }, [todayYmd, daily, hourly])

  useEffect(() => {
    const c = clampYmd(visitYmd, dateMin, dateMax)
    if (c !== visitYmd) onScheduleChange({ ...schedule, visitDateYmd: c })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- schedule 스냅 1회; 전체 schedule은 렌더 시점 값 사용
  }, [dateMin, dateMax, visitYmd])

  const visitRepresentative: CurrentWeather | null = useMemo(() => {
    if (!weather) return null
    const row = daily.find((d) => d.date === visitYmd)
    if (row) return syntheticFromDaily(row, weather)
    const h = pickHourlyForVisitDay(hourly, visitYmd, todayYmd)
    if (h) return hourlyToCurrent(h, weather)
    return null
  }, [weather, daily, hourly, visitYmd, todayYmd])

  const handleVisitDateIso = (iso: string) => {
    if (!iso) return
    const ymd = clampYmd(dateInputToYmd(iso), dateMin, dateMax)
    onScheduleChange({
      ...schedule,
      visitDateYmd: ymd,
    })
  }

  const topAlert = alerts.find((a) => a.type || a.message) ?? null

  if (loading && !weather) {
    return (
      <div className="space-y-3">
        {[32, 20, 16].map((h) => (
          <div
            key={h}
            className="animate-pulse rounded-lg"
            style={{ background: 'var(--border)', height: `${h * 4}px` }}
          />
        ))}
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="glass-card rounded-lg p-5 text-center" style={{ color: 'var(--muted)' }}>
        <p className="text-sm">날씨 데이터를 불러오는 중...</p>
      </div>
    )
  }

  const visitLabel = weatherLabel(
    visitRepresentative?.skyCode ?? weather.skyCode,
    visitRepresentative?.ptyCode ?? weather.ptyCode,
  )
  const visitEmoji = weatherEmojiFromLabel(visitLabel)
  /** 선택일 대표 슬롯 기준 체감(해당 슬롯의 풍속·습도 사용) */
  const visitFl = visitRepresentative
    ? feelsLike(
        visitRepresentative.temperature,
        visitRepresentative.windSpeed,
        visitRepresentative.humidity,
      )
    : null

  const visitWindDir = visitRepresentative
    ? windDirectionLabel(visitRepresentative.windDirection)
    : null

  const visitDisplayTemp = visitRepresentative?.temperature
  const dailyForVisit = daily.find((d) => d.date === visitYmd)

  return (
    <div className="space-y-3">
      {topAlert && (
        <div
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}
        >
          <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>
              {topAlert.type || '기상특보'}
              {topAlert.level ? ` (${topAlert.level})` : ''} 발효 중
            </p>
            <p className="text-xs mt-0.5 leading-snug line-clamp-2" style={{ color: '#ef4444' }}>
              {topAlert.message || topAlert.region || ''}
            </p>
          </div>
          {alerts.length > 1 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold"
              style={{ background: 'rgba(239,68,68,0.14)', color: '#dc2626' }}
            >
              +{alerts.length - 1}
            </span>
          )}
        </div>
      )}

      <div className="glass-card rounded-lg px-3 py-3 space-y-3">
        {showLocationBar ? (
          <>
            <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>관심 지역</p>
            <div className="flex gap-2 items-end">
              <div className="flex-1 min-w-0">
                <CompactLocationBar
                  currentLocation={pinnedLocation}
                  onSelect={onLocationSelect}
                  placeholder={pinnedLocation ? pinnedLocation.name : '관심 지역 검색'}
                />
              </div>
              {onUseCurrentLocation && (
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  disabled={gpsLoading}
                  className="flex items-center justify-center transition-all active:opacity-80 flex-shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    fontSize: 20,
                    color: gpsLoading ? 'var(--muted)' : 'var(--humidity)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                  aria-label="현재 위치로 관심지역·조회 일정을 맞추기"
                  title="현재 GPS 위치로 고정하고, 조회 날짜·시간대를 지금으로"
                >
                  {gpsLoading ? '⟳' : '📍'}
                </button>
              )}
            </div>
          </>
        ) : null}

        <label className="block space-y-1">
          <span className="text-xs font-semibold leading-snug" style={{ color: 'var(--muted)' }}>
            조회 날짜 (저장되어 앱을 다시 열어도 유지)
          </span>
          <input
            type="date"
            className="w-full text-sm rounded-lg px-2 py-2 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={ymdToDateInput(clampYmd(visitYmd, dateMin, dateMax))}
            min={ymdToDateInput(dateMin)}
            max={ymdToDateInput(dateMax)}
            onChange={(e) => handleVisitDateIso(e.target.value)}
          />
        </label>
      </div>

      <div
        className="glass-card rounded-lg px-4 py-4"
        style={!visitRepresentative ? { opacity: 0.88 } : undefined}
      >
        <div className="flex gap-3 items-stretch">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              선택 날짜 날씨
            </p>
            {!visitRepresentative ? (
              <p className="text-sm font-medium leading-snug" style={{ color: 'var(--muted)' }}>
                이 날짜의 예보 데이터가 없습니다.
                <span className="block text-[11px] mt-1 opacity-90">
                  주간·시간별 범위 안의 날짜를 선택해 보세요.
                </span>
              </p>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold leading-none" style={{ color: 'var(--text)' }}>
                    {fmt(visitDisplayTemp!)}
                  </span>
                  <span className="text-2xl">{visitEmoji}</span>
                </div>
                <p className="text-xs mt-1 font-medium truncate" style={{ color: 'var(--muted)' }}>{visitLabel}</p>
                {visitFl != null && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                      체감온도
                    </p>
                    <p className="text-xl font-bold tabular-nums leading-tight mt-0.5" style={{ color: 'var(--text)' }}>
                      {fmt(visitFl)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="w-px self-stretch shrink-0" style={{ background: 'var(--border)' }} aria-hidden />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--muted)' }} aria-hidden>
              {'\u00A0'}
            </p>
            {!visitRepresentative ? (
              <p className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                예보 없음
              </p>
            ) : (
              <>
                {dailyForVisit ? (
                  <>
                    <div className="flex items-baseline gap-1 justify-end flex-wrap">
                      <span className="text-xl font-bold tabular-nums leading-none" style={{ color: '#EF4444' }}>
                        {fmt(dailyForVisit.maxTemp)}
                      </span>
                      <span className="text-sm font-medium px-0.5" style={{ color: 'var(--muted)' }}>/</span>
                      <span className="text-xl font-bold tabular-nums leading-none" style={{ color: '#3B82F6' }}>
                        {fmt(dailyForVisit.minTemp)}
                      </span>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>최고 / 최저</p>
                  </>
                ) : (
                  <p className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                    일별 최고·최저 없음
                  </p>
                )}

                <p className="text-xs mt-3 leading-snug" style={{ color: 'var(--muted)' }}>
                  💧 습도 {visitRepresentative.humidity}%
                </p>
                <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--muted)' }}>
                  💨 {visitWindDir ?? '—'} {visitRepresentative.windSpeed.toFixed(1)}m/s
                </p>
              </>
            )}
          </div>
        </div>
        <p className="text-[11px] mt-2 truncate" style={{ color: 'var(--muted)', opacity: 0.85 }}>
          {location.address ?? location.name}
        </p>
      </div>

      {hourly.length > 0 && (
        <HourlyWeatherStrip
          hourly={hourly}
          currentHour={currentHour}
          highlightTargetYmd={visitYmd}
          fadeNonMatchingTargetYmd
        />
      )}

      {daily.length > 0 && (
        <div className="glass-card rounded-lg px-4 py-3">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>주간 예보</p>
          <div className="space-y-2.5">
            {daily.slice(0, 7).map((d) => {
              const label = dayLabel(d.date, todayYmd)
              const emoji = weatherEmojiFromLabel(weatherLabel(d.skyCode, d.ptyCode))
              const isHighlight = d.date === visitYmd
              return (
                <div
                  key={d.date}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1 -mx-2"
                  style={
                    isHighlight
                      ? { background: 'var(--primary-tint-10)', outline: '1px solid var(--primary)' }
                      : undefined
                  }
                >
                  <div className="w-10 flex-shrink-0 text-center">
                    <span
                      className="text-xs font-semibold block"
                      style={{ color: isHighlight ? 'var(--primary)' : 'var(--muted)' }}
                    >
                      {label}
                    </span>
                    <span className="text-[10px] block opacity-55" style={{ color: 'var(--muted)' }}>
                      {mmdd(d.date)}
                    </span>
                  </div>
                  <span className="text-base flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs truncate block" style={{ color: 'var(--muted)' }}>
                      {weatherLabel(d.skyCode, d.ptyCode)}
                      {d.pop > 0 && <span className="ml-1.5 opacity-70">☂ {d.pop}%</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 text-xs font-semibold">
                    <span style={{ color: '#3B82F6' }}>{fmt(d.minTemp)}</span>
                    <span style={{ color: 'var(--muted)', fontWeight: 400, opacity: 0.5 }}>/</span>
                    <span style={{ color: '#EF4444' }}>{fmt(d.maxTemp)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

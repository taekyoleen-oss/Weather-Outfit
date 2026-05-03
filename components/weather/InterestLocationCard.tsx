'use client'

import { useMemo } from 'react'
import type { CurrentWeather, HourlyForecast, DailyForecast, WeatherAlert } from '@/types/weather'
import type { LocationInfo } from '@/types/location'
import {
  weatherLabel,
  weatherEmojiFromLabel,
  feelsLike,
  windDirectionLabel,
} from '@/lib/utils/formatWeather'
import { kstTodayYmd, addCalendarDaysFromKstYmd } from '@/lib/utils/timeOfDay'
import { endHourFromStart } from '@/lib/utils/visitSchedule'
import type { VisitSchedule } from '@/lib/utils/visitSchedule'
import { HourlyWeatherStrip } from './HourlyWeatherStrip'
import { CompactLocationBar } from './CompactLocationBar'

interface Props {
  weather: CurrentWeather | null
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  alerts: WeatherAlert[]
  location: LocationInfo
  currentHour: number
  loading?: boolean
  /** 항상 유효한 관심 일정(부모에서 기본값·정규화) */
  schedule: VisitSchedule
  onScheduleChange: (s: VisitSchedule) => void
  pinnedLocation: LocationInfo | null
  onLocationSelect: (loc: LocationInfo) => void
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

function hhmm(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

const DATE_OPTS = [
  { value: 0 as const, label: '오늘' },
  { value: 1 as const, label: '내일' },
  { value: 2 as const, label: '모레' },
]

function HourPicker({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (h: number) => void
}) {
  const dec = () => {
    const next = value - 1
    if (min !== undefined && next < min) return
    onChange((next + 24) % 24)
  }
  const inc = () => {
    const next = value + 1
    if (max !== undefined && next > max) return
    onChange(next % 24)
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium w-8" style={{ color: 'var(--muted)' }}>{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={dec}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all active:scale-90"
          style={{ background: 'var(--primary-tint-10)', color: 'var(--humidity)' }}
          aria-label="-1시간"
        >◄</button>
        <span className="text-lg font-bold min-w-[3.5rem] text-center" style={{ color: 'var(--text)' }}>
          {hhmm(value)}
        </span>
        <button
          onClick={inc}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all active:scale-90"
          style={{ background: 'var(--primary-tint-10)', color: 'var(--humidity)' }}
          aria-label="+1시간"
        >►</button>
      </div>
    </div>
  )
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
}: Props) {
  const todayYmd = kstTodayYmd()
  const visitYmd = useMemo(
    () => addCalendarDaysFromKstYmd(todayYmd, schedule.dateOffset),
    [schedule.dateOffset, todayYmd],
  )

  const slotWeather: CurrentWeather | null = useMemo(() => {
    if (!weather || !hourly.length) return weather
    const wantH = schedule.startHour
    const entry =
      hourly.find((h) => {
        const hh = parseInt(h.time.split(':')[0], 10)
        if (Number.isNaN(hh) || hh !== wantH) return false
        return h.fcstDate === visitYmd || !h.fcstDate
      }) ?? hourly.find((h) => parseInt(h.time.split(':')[0], 10) === wantH)
    if (!entry) return weather
    return hourlyToCurrent(entry, weather)
  }, [weather, hourly, schedule.startHour, visitYmd])

  const handleDateChange = (d: 0 | 1 | 2) => {
    onScheduleChange({ dateOffset: d, startHour: schedule.startHour, endHour: schedule.endHour })
  }

  const handleStartChange = (h: number) => {
    const newEnd = Math.min(endHourFromStart(h), 23)
    const end = newEnd >= h ? newEnd : Math.min(h + 1, 23)
    onScheduleChange({ dateOffset: schedule.dateOffset, startHour: h, endHour: end })
  }

  const handleEndChange = (h: number) => {
    if (h <= schedule.startHour) return
    onScheduleChange({ dateOffset: schedule.dateOffset, startHour: schedule.startHour, endHour: h })
  }

  const topAlert = alerts.find(a => a.type || a.message) ?? null

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && !weather) {
    return (
      <div className="space-y-3">
        {[32, 20, 16].map(h => (
          <div
            key={h}
            className="animate-pulse rounded-lg"
            style={{ background: 'var(--border)', height: `${h * 4}px` }}
          />
        ))}
      </div>
    )
  }

  if (!weather || !slotWeather) {
    return (
      <div className="glass-card rounded-lg p-5 text-center" style={{ color: 'var(--muted)' }}>
        <p className="text-sm">날씨 데이터를 불러오는 중...</p>
      </div>
    )
  }

  const slotLabel = weatherLabel(slotWeather.skyCode, slotWeather.ptyCode)
  const slotEmoji = weatherEmojiFromLabel(slotLabel)
  const slotFl = feelsLike(slotWeather.temperature, slotWeather.windSpeed, slotWeather.humidity)

  const curLabel = weatherLabel(weather.skyCode, weather.ptyCode)
  const curEmoji = weatherEmojiFromLabel(curLabel)
  const curFl = feelsLike(weather.temperature, weather.windSpeed, weather.humidity)
  const windDir = windDirectionLabel(weather.windDirection)

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

      {/* 상단: 관심 지역 + 관심 일정 */}
      <div className="glass-card rounded-lg px-3 py-3 space-y-3">
        <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>관심 지역</p>
        <CompactLocationBar
          currentLocation={pinnedLocation}
          onSelect={onLocationSelect}
          placeholder={pinnedLocation ? pinnedLocation.name : '관심 지역 검색'}
        />

        <div className="flex gap-1.5 pt-1">
          {DATE_OPTS.map(d => (
            <button
              key={d.value}
              type="button"
              onClick={() => handleDateChange(d.value)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
              style={{
                background: schedule.dateOffset === d.value ? 'var(--primary)' : 'var(--primary-tint-08)',
                color: schedule.dateOffset === d.value ? 'white' : 'var(--humidity)',
                border: `1px solid ${schedule.dateOffset === d.value ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <HourPicker
          label="시작"
          value={schedule.startHour}
          min={0}
          max={schedule.endHour - 1}
          onChange={handleStartChange}
        />
        <HourPicker
          label="종료"
          value={schedule.endHour}
          min={schedule.startHour + 1}
          max={23}
          onChange={handleEndChange}
        />
        <p className="text-[10px] text-center" style={{ color: 'var(--muted)' }}>
          종료는 기본적으로 시작 후 4시간 — 필요 시 조정할 수 있어요
        </p>
      </div>

      {/* 관심 시간 날씨 | 지금 */}
      <div className="glass-card rounded-lg px-4 py-4">
        <div className="flex gap-3 items-stretch">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              관심 시간 ({hhmm(schedule.startHour)} 기준)
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold leading-none" style={{ color: 'var(--text)' }}>
                {fmt(slotWeather.temperature)}
              </span>
              <span className="text-2xl">{slotEmoji}</span>
            </div>
            <p className="text-xs mt-1 font-medium truncate" style={{ color: 'var(--muted)' }}>{slotLabel}</p>
          </div>
          <div className="w-px self-stretch shrink-0" style={{ background: 'var(--border)' }} aria-hidden />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>지금</p>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-4xl font-bold leading-none" style={{ color: 'var(--text)' }}>
                {fmt(weather.temperature)}
              </span>
              <span className="text-2xl">{curEmoji}</span>
            </div>
            <p className="text-xs mt-1 font-medium truncate" style={{ color: 'var(--muted)' }}>{curLabel}</p>
          </div>
        </div>
        <p className="text-[11px] mt-2 truncate" style={{ color: 'var(--muted)', opacity: 0.85 }}>
          {location.address ?? location.name}
        </p>
        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-left" style={{ borderColor: 'var(--border)' }}>
          <div>
            <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>관심 시간 체감</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmt(slotFl)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>지금 체감</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmt(curFl)}</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t flex flex-wrap gap-3 justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            💨 {windDir} {weather.windSpeed.toFixed(1)}m/s
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>💧 {weather.humidity}%</span>
        </div>
      </div>

      {hourly.length > 0 && (
        <HourlyWeatherStrip
          hourly={hourly}
          currentHour={currentHour}
          selectedPeriodStart={schedule.startHour}
          selectedPeriodEnd={schedule.endHour}
          selectedDayOffset={schedule.dateOffset}
          highlightTargetYmd={visitYmd}
        />
      )}

      {daily.length > 0 && (
        <div className="glass-card rounded-lg px-4 py-3">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>주간 예보</p>
          <div className="space-y-2.5">
            {daily.slice(0, 7).map(d => {
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

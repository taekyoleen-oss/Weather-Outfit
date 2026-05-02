'use client'

import { useState, useMemo, useEffect } from 'react'
import type { CurrentWeather, HourlyForecast, DailyForecast, WeatherAlert } from '@/types/weather'
import type { LocationInfo } from '@/types/location'
import { weatherLabel, weatherEmojiFromLabel, feelsLike, windDirectionLabel } from '@/lib/utils/formatWeather'
import { kstTodayYmd, addCalendarDaysFromKstYmd } from '@/lib/utils/timeOfDay'
import { HourlyWeatherStrip } from './HourlyWeatherStrip'
import type { VisitSchedule } from '@/app/page'

interface Props {
  weather: CurrentWeather | null
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  alerts: WeatherAlert[]
  location: LocationInfo
  currentHour: number
  loading?: boolean
  visitSchedule: VisitSchedule | null
  onVisitScheduleChange: (s: VisitSchedule | null) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── HourPicker sub-component ─────────────────────────────────────────────────
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
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all active:scale-90"
          style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--humidity)' }}
          aria-label="-1시간"
        >◄</button>
        <span
          className="text-lg font-bold min-w-[3.5rem] text-center"
          style={{ color: 'var(--text)' }}
        >
          {hhmm(value)}
        </span>
        <button
          onClick={inc}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all active:scale-90"
          style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--humidity)' }}
          aria-label="+1시간"
        >►</button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function InterestLocationCard({
  weather,
  hourly,
  daily,
  alerts,
  location,
  currentHour,
  loading,
  visitSchedule,
  onVisitScheduleChange,
}: Props) {
  const todayYmd = kstTodayYmd()

  // ── Visit panel local state ───────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false)
  const [draftDate, setDraftDate] = useState<0 | 1 | 2>(0)
  const [draftStart, setDraftStart] = useState(() => Math.min(currentHour + 1, 22))
  const [draftEnd, setDraftEnd] = useState(() => Math.min(currentHour + 3, 23))

  // Sync draft when schedule is externally set (open panel from parent state on first load)
  useEffect(() => {
    if (visitSchedule) {
      setDraftDate(visitSchedule.dateOffset)
      setDraftStart(visitSchedule.startHour)
      setDraftEnd(visitSchedule.endHour)
      setPanelOpen(true)
    }
  }, []) // intentionally run once on mount to sync from persisted schedule

  // Close panel when parent auto-resets the schedule
  useEffect(() => {
    if (!visitSchedule && panelOpen) {
      setPanelOpen(false)
    }
  }, [visitSchedule]) // eslint-disable-line react-hooks/exhaustive-deps

  function openScheduler() {
    const start = Math.min(currentHour + 1, 22)
    const end = Math.min(currentHour + 3, 23)
    setDraftDate(0)
    setDraftStart(start)
    setDraftEnd(end)
    setPanelOpen(true)
    onVisitScheduleChange({ dateOffset: 0, startHour: start, endHour: end })
  }

  function closeScheduler() {
    setPanelOpen(false)
    onVisitScheduleChange(null)
  }

  function handleDateChange(d: 0 | 1 | 2) {
    setDraftDate(d)
    onVisitScheduleChange({ dateOffset: d, startHour: draftStart, endHour: draftEnd })
  }

  function handleStartChange(h: number) {
    const newEnd = h >= draftEnd ? Math.min(h + 1, 23) : draftEnd
    setDraftStart(h)
    setDraftEnd(newEnd)
    onVisitScheduleChange({ dateOffset: draftDate, startHour: h, endHour: newEnd })
  }

  function handleEndChange(h: number) {
    if (h <= draftStart) return
    setDraftEnd(h)
    onVisitScheduleChange({ dateOffset: draftDate, startHour: draftStart, endHour: h })
  }

  // ── Visit period weather entries ──────────────────────────────────────────
  const visitYmd = useMemo(
    () => draftDate === 0 ? todayYmd : addCalendarDaysFromKstYmd(todayYmd, draftDate),
    [draftDate, todayYmd],
  )

  const visitPeriodEntries = useMemo(() => {
    if (!panelOpen) return []
    return hourly.filter(h => {
      const hh = parseInt(h.time.split(':')[0], 10)
      const dateOk = h.fcstDate === visitYmd || !h.fcstDate
      return dateOk && hh >= draftStart && hh <= draftEnd
    })
  }, [panelOpen, hourly, visitYmd, draftStart, draftEnd])

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading && !weather) {
    return (
      <div className="space-y-3">
        {[32, 20, 16].map(h => (
          <div
            key={h}
            className="animate-pulse rounded-2xl"
            style={{ background: 'var(--border)', height: `${h * 4}px` }}
          />
        ))}
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center" style={{ color: 'var(--muted)' }}>
        <p className="text-sm">날씨 데이터를 불러오는 중...</p>
      </div>
    )
  }

  const wLabel = weatherLabel(weather.skyCode, weather.ptyCode)
  const wEmoji = weatherEmojiFromLabel(wLabel)
  const fl = feelsLike(weather.temperature, weather.windSpeed, weather.humidity)
  const windDir = windDirectionLabel(weather.windDirection)
  const topAlert = alerts.find(a => a.type || a.message) ?? null

  return (
    <div className="space-y-3">

      {/* ── 1. 특보 배너 ── */}
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

      {/* ── 2. 현재 날씨 카드 ── */}
      <div className="glass-card rounded-2xl px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold leading-none" style={{ color: 'var(--text)' }}>
                {fmt(weather.temperature)}
              </span>
              <span className="text-3xl">{wEmoji}</span>
            </div>
            <p className="text-sm mt-1.5 font-medium" style={{ color: 'var(--muted)' }}>{wLabel}</p>
            <p className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: 'var(--muted)', opacity: 0.7 }}>
              {location.address ?? location.name}
            </p>
          </div>
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-3 py-2"
            style={{ background: 'rgba(91,141,238,0.08)', minWidth: 64 }}
          >
            <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>체감</span>
            <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>{fmt(fl)}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t flex gap-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-base">💨</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {windDir} {weather.windSpeed.toFixed(1)}m/s
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">💧</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{weather.humidity}%</span>
          </div>
          {weather.precipitation > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-base">🌧</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{weather.precipitation}mm</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. 시간별 스트립 (방문 일정 구간 하이라이트) ── */}
      {hourly.length > 0 && (
        <HourlyWeatherStrip
          hourly={hourly}
          currentHour={currentHour}
          selectedPeriodStart={panelOpen ? draftStart : undefined}
          selectedPeriodEnd={panelOpen ? draftEnd : undefined}
          selectedDayOffset={panelOpen ? draftDate : undefined}
          highlightTargetYmd={panelOpen ? visitYmd : undefined}
        />
      )}

      {/* ── 4. 방문 예정 일정 ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base flex-shrink-0">🗓</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              방문 예정 일정
            </span>
            {visitSchedule && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                style={{ background: 'rgba(91,141,238,0.12)', color: 'var(--humidity)' }}
              >
                {DATE_OPTS.find(d => d.value === draftDate)?.label}{' '}
                {hhmm(draftStart)} ~ {hhmm(draftEnd)}
              </span>
            )}
          </div>

          {panelOpen ? (
            <button
              onClick={closeScheduler}
              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}
            >
              초기화
            </button>
          ) : (
            <button
              onClick={openScheduler}
              className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all active:scale-95 flex-shrink-0"
              style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--humidity)', border: '1px solid var(--border)' }}
            >
              설정
            </button>
          )}
        </div>

        {/* Expanded picker */}
        {panelOpen && (
          <div className="px-4 pb-4 space-y-3.5 border-t" style={{ borderColor: 'var(--border)' }}>

            {/* Date chips */}
            <div className="flex gap-1.5 pt-3.5">
              {DATE_OPTS.map(d => (
                <button
                  key={d.value}
                  onClick={() => handleDateChange(d.value)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: draftDate === d.value ? 'var(--primary)' : 'rgba(91,141,238,0.08)',
                    color: draftDate === d.value ? 'white' : 'var(--humidity)',
                    border: `1px solid ${draftDate === d.value ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Start hour */}
            <HourPicker
              label="개시"
              value={draftStart}
              min={0}
              max={draftEnd - 1}
              onChange={handleStartChange}
            />

            {/* End hour */}
            <HourPicker
              label="종료"
              value={draftEnd}
              min={draftStart + 1}
              max={23}
              onChange={handleEndChange}
            />

            {/* Duration badge */}
            <div className="flex justify-center">
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: 'rgba(91,141,238,0.08)', color: 'var(--muted)' }}
              >
                총 {draftEnd - draftStart}시간
              </span>
            </div>

            {/* Period weather chips */}
            {visitPeriodEntries.length > 0 ? (
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex gap-2 pb-0.5" style={{ minWidth: 'max-content' }}>
                  {visitPeriodEntries.map(entry => {
                    const eEmoji = weatherEmojiFromLabel(weatherLabel(entry.skyCode, entry.ptyCode))
                    return (
                      <div
                        key={`${entry.fcstDate ?? ''}-${entry.time}`}
                        className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl flex-shrink-0"
                        style={{ background: 'rgba(91,141,238,0.07)', border: '1px solid var(--border)', minWidth: 52 }}
                      >
                        <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
                          {entry.time.slice(0, 5)}
                        </span>
                        <span className="text-lg leading-none">{eEmoji}</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                          {fmt(entry.temperature)}
                        </span>
                        {entry.pop > 0 && (
                          <span className="text-[10px]" style={{ color: '#3B82F6' }}>
                            ☂{entry.pop}%
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div
                className="py-2.5 rounded-xl text-center"
                style={{ background: 'rgba(0,0,0,0.03)', border: '1px dashed var(--border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  해당 시간대 예보 데이터가 없습니다
                </p>
              </div>
            )}

            {/* Auto-reset notice */}
            {draftDate === 0 && (
              <p className="text-[10px] text-center" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                종료 시간이 지나면 자동으로 초기화됩니다
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 5. 주간 예보 ── */}
      {daily.length > 0 && (
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>주간 예보</p>
          <div className="space-y-2.5">
            {daily.slice(0, 7).map(d => {
              const label = dayLabel(d.date, todayYmd)
              const emoji = weatherEmojiFromLabel(weatherLabel(d.skyCode, d.ptyCode))
              const isToday = d.date === todayYmd
              return (
                <div key={d.date} className="flex items-center gap-2.5">
                  <div className="w-10 flex-shrink-0 text-center">
                    <span
                      className="text-xs font-semibold block"
                      style={{ color: isToday ? 'var(--primary)' : 'var(--muted)' }}
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

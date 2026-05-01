'use client'

import { useState, useEffect, useRef } from 'react'
import { WeatherHeroIllustration } from './WeatherHeroIllustration'
import { FreshnessBadge } from './FreshnessBadge'
import type {
  CurrentWeather,
  SunriseSunset,
  TimeOfDay,
  DustData,
  WeatherAlert,
  PreviousPeriodWeatherSummary,
  MorningSummary,
  DailyForecast,
} from '@/types/weather'
import type { OpenMeteoDailyCompare } from '@/lib/weather/openMeteoCompare'
import {
  weatherLabel,
  windDirectionLabel,
  feelsLike,
  formatTemp1,
  formatOpenMeteoCompareLine,
  uvLabel,
  uvColor,
  formatTime,
  o3GradeLabel,
  o3GradeColor,
  computeHeatIndex,
  heatIndexLabel,
  heatIndexColor,
} from '@/lib/utils/formatWeather'
import { KMA_WEATHER_WARN_PAGE } from '@/lib/weather/kma-alert'

interface Props {
  weather: CurrentWeather | null
  period: TimeOfDay
  heroIconSrc?: string
  heroIconHour?: number
  heroSunsetHm?: number | null
  loading?: boolean
  addressLine?: string | null
  sunriseSunset?: SunriseSunset | null
  uvDisplay?: number
  dust?: DustData | null
  alerts?: WeatherAlert[]
  /** 직전에 끝난 시간대(예: 새벽) 대표 날씨 */
  previousPeriodWeather?: PreviousPeriodWeatherSummary | null
  /** 어제 동시간대·오늘 일 최저·최고 (Open-Meteo) */
  openMeteoCompare?: OpenMeteoDailyCompare | null
  /** 오전(6–11시) 날씨 요약 — 오후에만 전달 */
  morningSummary?: MorningSummary | null
  /** 내일/모레 요약(작은 텍스트): 날씨 + 최고/최저 */
  futureDaily?: DailyForecast[]
}

const BG_MAP: Record<TimeOfDay, string> = {
  morning: 'var(--bg-morning)',
  day: 'var(--bg-day)',
  evening: 'var(--bg-evening)',
  night: 'var(--bg-night)',
}

const TEXT_NIGHT = 'rgba(226,232,240,0.9)'

function extractDongUnit(locationName?: string, addressLine?: string | null): string | undefined {
  const sources = [addressLine ?? '', locationName ?? ''].filter(Boolean)
  for (const src of sources) {
    const tokens = src.split(/\s+/)
    const unit = tokens.find((t) => /(?:동|읍|면|리|가)$/.test(t))
    if (unit) return unit
  }
  return undefined
}

function compactAlertSummary(alert: WeatherAlert | null): string {
  if (!alert) return '특보 없음'
  const src = `${alert.message ?? ''} ${alert.type ?? ''}`.trim()
  const matched = src.match(/[가-힣]+(?:주의보|경보)/g) ?? []
  const uniq = Array.from(new Set(matched))
  if (uniq.length > 0) return uniq.join(', ')
  const fallbackType = alert.type?.trim()
  if (fallbackType) return fallbackType
  return '특보'
}

/** 동일 요약끼리 건수 합산 후 한 줄. 유형 3개↑는 앞 2개만 + 「등」, 원본 특보가 3건↑이면 끝에 「등」 */
function formatAlertsSingleLine(alerts: WeatherAlert[]): string {
  if (alerts.length === 0) return ''
  const summaries = alerts.map((a) => compactAlertSummary(a))
  const counts = new Map<string, number>()
  for (const s of summaries) {
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  const entries = Array.from(counts.entries())
  const segments = entries.map(([label, n]) => (n > 1 ? `${label} ${n}건` : label))

  let line: string
  if (segments.length > 2) {
    line = `${segments[0]} · ${segments[1]} 등`
  } else {
    line = segments.join(' · ')
  }

  const alreadyHasEtc = line.endsWith(' 등')
  if (alerts.length > 2 && !alreadyHasEtc) {
    line += ' 등'
  }

  return line
}

// ─── 기상 지수 안내 데이터 ─────────────────────────────────────────────────────
// 근거: weather-outdoor-clothing-guide.md 다. 공식 위험 기준

interface IndexRow { level: string; range: string; colorHex: string; clothing: string }

const UV_LEVELS: IndexRow[] = [
  { level: '낮음', range: '0–2', colorHex: '#22C55E', clothing: '일반 외출 가능. 민감 피부는 선크림 권장.' },
  { level: '보통', range: '3–5', colorHex: '#84CC16', clothing: '모자, 선글라스, SPF30+ 선크림 권장.' },
  { level: '높음', range: '6–7', colorHex: '#EAB308', clothing: '한낮 그늘 유지. 긴 소매·챙 넓은 모자·선글라스·선크림 필수.' },
  { level: '매우높음', range: '8–10', colorHex: '#F97316', clothing: '오전 10시~오후 3시 외출 최소화. 긴 소매·모자·선글라스·선크림 필수.' },
  { level: '위험', range: '11+', colorHex: '#EF4444', clothing: '가능한 실내에 머물기. 외출 시 완전 차단 필수.' },
]

const O3_LEVELS: IndexRow[] = [
  { level: '좋음', range: '~0.030 ppm', colorHex: '#22C55E', clothing: '별도 제한 없음.' },
  { level: '보통', range: '0.031–0.090 ppm', colorHex: '#84CC16', clothing: '민감군은 유의.' },
  { level: '나쁨', range: '0.091–0.150 ppm', colorHex: '#F97316', clothing: '한낮(10시~16시) 격한 운동 제한. 아침·저녁 시간대로 조정.' },
  { level: '매우나쁨', range: '0.151+ ppm', colorHex: '#EF4444', clothing: '실외활동 최소화. 민감군·어린이·노약자 실내 권고.' },
]

const HEAT_LEVELS: IndexRow[] = [
  { level: '관심', range: '체감 29–32°C', colorHex: '#FCD34D', clothing: '통기성 밝은색 옷, 수분 섭취, 그늘 휴식.' },
  { level: '주의', range: '체감 33–34°C', colorHex: '#FB923C', clothing: '밝은색 헐렁한 핏·흡습속건 소재. 장시간 야외 자제.' },
  { level: '경고', range: '체감 35–37°C', colorHex: '#EF4444', clothing: '이른 아침·저녁으로 활동 조정. 냉감 소재·선크림 필수.' },
  { level: '위험', range: '체감 38°C↑', colorHex: '#B91C1C', clothing: '한낮 야외 중단. 실내 대체 권고. 취약자 특별 주의.' },
]

const COLD_LEVELS: IndexRow[] = [
  { level: '바람 주의', range: '풍속 5–13 m/s', colorHex: '#93C5FD', clothing: '방풍 바람막이, 고정되는 모자. 강변·개방지 체감 -2~3°C.' },
  { level: '강풍주의보', range: '풍속 14–20 m/s', colorHex: '#3B82F6', clothing: '우산 대신 방수 재킷. 낙하물 위험 지역 회피.' },
  { level: '강풍경보', range: '풍속 21 m/s↑', colorHex: '#1D4ED8', clothing: '야외활동 취소. 골프·등산·자전거·강변 활동 중단.' },
  { level: '한파주의보', range: '최저 ≤3°C 급강하 또는 -12°C 이하', colorHex: '#67E8F9', clothing: '내복·목도리·장갑·모자로 노출 부위 보온.' },
  { level: '한파경보', range: '-15°C 이하 2일 이상 지속', colorHex: '#0EA5E9', clothing: '장시간 야외 금지. 방풍+보온+방한화 완비.' },
]

// ─── 공통 모달 ─────────────────────────────────────────────────────────────────

function IndexModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-sm max-h-[80dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{title}</p>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ color: 'var(--muted)', background: 'var(--surface)', width: 44, height: 44, fontSize: 14 }}
            aria-label="닫기"
          >✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {children}
        </div>
      </div>
    </div>
  )
}

function IndexTable({ rows, source }: { rows: IndexRow[]; source: string }) {
  return (
    <div>
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        {rows.map((row, i) => (
          <div
            key={row.level}
            className="flex gap-2 px-3 py-2"
            style={{
              background: i % 2 === 0 ? 'var(--surface)' : 'rgba(248,250,252,0.6)',
              borderTop: i > 0 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div className="flex items-center gap-1.5 w-[72px] flex-shrink-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.colorHex }} />
              <span className="text-[10px] font-bold leading-tight" style={{ color: row.colorHex }}>
                {row.level}
              </span>
            </div>
            <div className="w-[90px] flex-shrink-0">
              <span className="text-[10px] font-medium leading-tight" style={{ color: 'var(--muted)' }}>
                {row.range}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed flex-1" style={{ color: 'var(--text)' }}>
              {row.clothing}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[9px] mt-1 ml-1" style={{ color: 'var(--muted)' }}>📋 {source}</p>
    </div>
  )
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

export function WeatherCard({
  weather,
  period,
  heroIconSrc,
  heroIconHour,
  heroSunsetHm,
  loading,
  addressLine,
  sunriseSunset,
  uvDisplay,
  dust,
  alerts,
  previousPeriodWeather,
  openMeteoCompare,
  morningSummary,
  futureDaily,
}: Props) {
  const [modal, setModal] = useState<'uv' | 'heat' | null>(null)

  const isNight = period === 'night'
  const textColor = isNight ? TEXT_NIGHT : 'var(--text)'
  // 모바일 유리배경에서 보조 텍스트 대비를 높여 가독성을 개선한다.
  const mutedColor = isNight ? 'rgba(203,213,225,0.95)' : 'rgba(51,65,85,0.88)'
  const infoBtnBg = isNight ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.5)'

  if (loading || !weather) {
    return (
      <div
        className="glass-card px-4 py-4 sm:px-6 sm:py-3 min-h-[160px] flex items-center justify-center"
        style={{ background: BG_MAP[period] }}
      >
        <div className="animate-pulse flex flex-col items-center gap-2 w-full">
          <div className="w-20 h-20 rounded-full bg-white/20" />
          <div className="h-8 w-20 bg-white/20 rounded-lg" />
          <div className="h-3 w-28 bg-white/20 rounded" />
        </div>
      </div>
    )
  }

  const feels = feelsLike(weather.temperature, weather.windSpeed, weather.humidity)
  const compareLine = formatOpenMeteoCompareLine(weather.temperature, openMeteoCompare ?? null)
  const uv = uvDisplay ?? weather.uvIndex
  const showAddress =
    addressLine &&
    addressLine.trim() !== '' &&
    addressLine.trim() !== weather.location.trim()
  const dongUnit = extractDongUnit(weather.location, addressLine)
  const locationTitle = dongUnit && dongUnit !== weather.location ? `${weather.location} · ${dongUnit}` : weather.location

  const visLabel = weather.visibility >= 10000
    ? '10km 이상'
    : `${(weather.visibility / 1000).toFixed(1)}km`
  const visSub = weather.visibility < 1000 ? '매우 나쁨' : weather.visibility < 5000 ? '나쁨' : '좋음'

  const o3Label = o3GradeLabel(dust?.o3Grade)
  const o3Color = o3GradeColor(dust?.o3Grade)
  const o3Value = dust?.o3Value != null ? `${dust.o3Value.toFixed(3)} ppm` : undefined
  const alertCount = alerts?.length ?? 0
  const alertLine = alertCount > 0 && alerts ? formatAlertsSingleLine(alerts) : ''

  const heatIdx = computeHeatIndex(weather.temperature, weather.humidity)
  const heatIdxDiff = heatIdx != null ? heatIdx - weather.temperature : null

  return (
    <div
      className="glass-card px-4 py-3 sm:px-6 overflow-hidden"
      style={{ background: BG_MAP[period] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0 flex-1 pr-1">
          <p className="text-sm font-semibold leading-tight" style={{ color: textColor }}>
            {locationTitle}
          </p>
          {showAddress && (
            <p
              className="text-[11px] sm:text-xs mt-1 leading-snug line-clamp-2"
              style={{ color: mutedColor }}
            >
              {addressLine}
            </p>
          )}
          <div className="mt-1">
            <FreshnessBadge fetchedAt={weather.fetchedAt} />
          </div>
        </div>
        <WeatherHeroIllustration
          skyCode={weather.skyCode}
          ptyCode={weather.ptyCode}
          period={period}
          iconSrc={heroIconSrc}
          iconHour={heroIconHour}
          sunsetHm={heroSunsetHm}
          size={120}
        />
      </div>

      {/* Temperature */}
      <div className="mt-1">
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-end gap-1.5">
            <span className="text-5xl font-bold leading-none tabular-nums" style={{ color: textColor }}>
              {formatTemp1(weather.temperature)}°
            </span>
            <span className="text-lg mb-0.5" style={{ color: mutedColor }}>C</span>
          </div>
          {(futureDaily?.length ?? 0) > 0 && (
            <div className="min-w-0 text-right space-y-0.5 pb-0.5">
              {futureDaily!.slice(0, 2).map((d, i) => (
                <p key={`${d.date}-${i}`} className="text-xs sm:text-[13px] leading-snug tabular-nums truncate" style={{ color: mutedColor }}>
                  {i === 0 ? '내일' : '모레'} {weatherLabel(d.skyCode, d.ptyCode)} · {formatTemp1(d.maxTemp)}°/{formatTemp1(d.minTemp)}°
                </p>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm mt-0.5 leading-snug" style={{ color: textColor }}>
          <span className="font-medium">{weatherLabel(weather.skyCode, weather.ptyCode)}</span>
          {compareLine ? (
            <>
              {' '}
              <span className="font-normal text-xs sm:text-sm" style={{ color: mutedColor }}>
                {compareLine}
              </span>
            </>
          ) : null}
        </p>
      </div>

      {previousPeriodWeather && (
        <div
          className="mt-2 rounded-xl px-2.5 py-2 text-left"
          style={{
            background: isNight ? 'rgba(148,163,184,0.12)' : 'rgba(91,141,238,0.08)',
            border: `1px solid ${isNight ? 'rgba(148,163,184,0.2)' : 'rgba(91,141,238,0.15)'}`,
          }}
        >
          <p className="text-[10px] font-medium leading-tight" style={{ color: mutedColor }}>
            직전 시간대 · {previousPeriodWeather.periodLabel}
          </p>
          <p className="text-xs font-semibold mt-1 tabular-nums leading-snug" style={{ color: textColor }}>
            <span className="mr-1">{previousPeriodWeather.emoji}</span>
            {previousPeriodWeather.weatherLabel}
            <span className="mx-1 font-normal" style={{ color: mutedColor }}>·</span>
            {formatTemp1(previousPeriodWeather.temperature)}°
            <span className="font-normal mx-1" style={{ color: mutedColor }}>/</span>
            체감 {formatTemp1(previousPeriodWeather.feelsLike)}°
          </p>
        </div>
      )}

      {morningSummary && (
        <div
          className="mt-2 rounded-xl px-2.5 py-2 text-left"
          style={{
            background: isNight ? 'rgba(148,163,184,0.10)' : 'rgba(251,191,36,0.08)',
            border: `1px solid ${isNight ? 'rgba(148,163,184,0.18)' : 'rgba(251,191,36,0.25)'}`,
          }}
        >
          <p className="text-[10px] font-medium leading-tight" style={{ color: mutedColor }}>
            오전 현황 · 06–11시
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm">{morningSummary.emoji}</span>
            <p className="text-xs font-semibold tabular-nums leading-snug" style={{ color: textColor }}>
              {morningSummary.weatherLabel}
              <span className="mx-1 font-normal" style={{ color: mutedColor }}>·</span>
              {formatTemp1(morningSummary.minTemp)}° – {formatTemp1(morningSummary.maxTemp)}°
            </p>
            {morningSummary.totalPrecip > 0 && (
              <span className="text-[10px] font-medium ml-auto tabular-nums" style={{ color: '#3B82F6' }}>
                ☂️ {morningSummary.totalPrecip.toFixed(1)}mm
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats grid: row1 = 체감/습도/바람, row2 = 가시거리/일출/일몰 */}
      <div className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-2 text-xs sm:text-sm">
        {/* 체감온도 with ℹ — 폭염/한파 기준 안내 */}
        <div className="text-center min-w-0 relative">
          <p className="text-xs" style={{ color: mutedColor }}>체감</p>
          <p className="font-semibold mt-0.5 tabular-nums" style={{ color: textColor }}>{formatTemp1(feels)}°</p>
          <button
            onClick={() => setModal('heat')}
            className="absolute -top-4 -right-4 flex items-center justify-center"
            style={{ width: 44, height: 44, background: 'transparent' }}
            aria-label="폭염·한파 기준 보기"
          >
            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: infoBtnBg, color: '#fff' }}>ℹ</span>
          </button>
        </div>

        <Stat label="습도" value={`${weather.humidity}%`} color={textColor} muted={mutedColor} />
        <Stat
          label="바람"
          value={`${windDirectionLabel(weather.windDirection)} ${weather.windSpeed}m/s`}
          color={textColor}
          muted={mutedColor}
        />

        {/* 가시거리 — WeatherCard로 이동 (기존 HighlightsGrid에서 이동) */}
        <Stat label="가시거리" value={visLabel} color={textColor} muted={mutedColor} sub={visSub} />
        <Stat
          label="일출"
          value={sunriseSunset ? formatTime(sunriseSunset.sunrise) : '--:--'}
          color={textColor}
          muted={mutedColor}
        />
        <Stat
          label="일몰"
          value={sunriseSunset ? formatTime(sunriseSunset.sunset) : '--:--'}
          color={textColor}
          muted={mutedColor}
        />
      </div>

      {/* 열지수 (습도 기반) — 기온 27°C↑, 습도 40%↑ 조건에서만 표시 */}
      {heatIdx != null && heatIdxDiff != null && heatIdxDiff >= 2 && (
        <div
          className="mt-2.5 rounded-xl px-2.5 py-2"
          style={{
            background: isNight
              ? `${heatIndexColor(heatIdx)}18`
              : `${heatIndexColor(heatIdx)}12`,
            border: `1px solid ${heatIndexColor(heatIdx)}40`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌡️</span>
              <p className="text-[10px] font-medium" style={{ color: mutedColor }}>
                열지수 (습도 기반)
              </p>
            </div>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: `${heatIndexColor(heatIdx)}20`,
                color: heatIndexColor(heatIdx),
              }}
            >
              {heatIndexLabel(heatIdx)}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold tabular-nums" style={{ color: heatIndexColor(heatIdx) }}>
              {formatTemp1(heatIdx)}°
            </span>
            <span className="text-[10px]" style={{ color: mutedColor }}>
              체감보다 +{formatTemp1(heatIdxDiff)}° 높음 (습도 {weather.humidity}%)
            </span>
          </div>
        </div>
      )}

      {/* UV + 오존 + 기상특보 하단 전용 섹션 */}
      <div
        className="mt-2.5 pt-2 flex items-start gap-1"
        style={{ borderTop: `1px solid ${isNight ? 'rgba(148,163,184,0.2)' : 'rgba(0,0,0,0.06)'}` }}
      >
        {/* 자외선 */}
        <div className="flex-[0.9] flex items-center gap-2 min-w-0">
          <span className="text-base">☀️</span>
          <div className="min-w-0">
            <p className="text-[10px] leading-none mb-0.5" style={{ color: mutedColor }}>자외선</p>
            <p className="text-sm font-bold leading-none" style={{ color: uvColor(uv) }}>UV {uv}</p>
            <p className="text-[10px] mt-0.5" style={{ color: uvColor(uv) }}>{uvLabel(uv)}</p>
          </div>
        </div>

        {/* 오존 */}
        <div className="flex-[0.9] flex items-center gap-2 min-w-0">
          <span className="text-base">⚗️</span>
          <div className="min-w-0">
            <p className="text-[10px] leading-none mb-0.5" style={{ color: mutedColor }}>오존</p>
            <p className="text-sm font-bold leading-none" style={{ color: o3Color }}>
              {o3Label}
            </p>
            {o3Value && (
              <p className="text-[10px] mt-0.5" style={{ color: mutedColor }}>{o3Value}</p>
            )}
          </div>
        </div>

        {/* 기상특보 */}
        <div className="flex-[1.3] flex items-start gap-1 min-w-0">
          <span className="text-base">⚠️</span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold leading-none" style={{ color: alertCount > 0 ? 'var(--danger)' : mutedColor }}>
              기상특보 {alertCount > 0 ? `${alertCount}건` : '없음'}
            </p>
            {alertCount > 0 ? (
              <p
                className="mt-0.5 text-[10px] leading-snug line-clamp-1 break-words min-w-0"
                style={{ color: mutedColor }}
                title={alertLine}
                aria-label={`발효 특보 ${alertCount}건: ${alertLine}`}
              >
                {alertLine}
              </p>
            ) : (
              <p className="text-[10px] mt-0.5 leading-none" style={{ color: mutedColor }}>
                {compactAlertSummary(null)}
              </p>
            )}
            {alertCount > 0 ? (
              <a
                href={KMA_WEATHER_WARN_PAGE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] mt-0.5 inline-block leading-none underline underline-offset-2"
                style={{ color: 'var(--humidity)' }}
              >
                특보 상세보기
              </a>
            ) : null}
          </div>
        </div>

        {/* ℹ 기준 보기 버튼 */}
        <button
          onClick={() => setModal('uv')}
          className="flex-shrink-0 flex items-center gap-1 px-2 rounded-lg text-[10px] font-semibold transition-opacity hover:opacity-80"
          style={{ background: infoBtnBg, color: '#fff', minHeight: 44 }}
          aria-label="자외선·오존 기준 보기"
        >
          <span>ℹ</span>
          <span>기준</span>
        </button>
      </div>

      {/* 모달: 자외선·오존 */}
      {modal === 'uv' && (
        <IndexModal title="☀️ 자외선 · ⚗️ 오존 기준" onClose={() => setModal(null)}>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary)' }}>☀️ 자외선 지수 (UV Index)</p>
            <IndexTable
              rows={UV_LEVELS}
              source="기상청 생활기상지수 · US EPA · 미국 피부과학회(AAD)"
            />
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary)' }}>⚗️ 오존 (O₃) 농도</p>
            <p className="text-[10px] mb-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
              오존은 자외선·고온 조건에서 높아집니다. 한낮(오전 10시~오후 4시)에 최고 농도를 보이며, 호흡량이 많은 운동 시 특히 주의가 필요합니다.
            </p>
            <IndexTable
              rows={O3_LEVELS}
              source="에어코리아 오존 행동요령"
            />
          </div>
        </IndexModal>
      )}

      {/* 모달: 폭염·한파 */}
      {modal === 'heat' && (
        <IndexModal title="🌡️ 폭염·체감온도 / 🥶 한파·바람 기준" onClose={() => setModal(null)}>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary)' }}>🌡️ 폭염·체감온도·습도</p>
            <p className="text-[10px] mb-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
              폭염은 체감온도 기준으로 판단합니다. 고온 다습 조건에서는 땀 배출이 빠른 기능성 소재와 통풍 구조가 중요합니다.
            </p>
            <IndexTable
              rows={HEAT_LEVELS}
              source="기상청 폭염 특보 기준 · CDC Extreme Heat"
            />
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary)' }}>🥶 한파·바람·체감추위</p>
            <p className="text-[10px] mb-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
              바람이 강할수록 노출 피부의 열손실이 커집니다. 같은 기온에서도 방풍 외피와 목·귀·손 보온이 필수입니다.
            </p>
            <IndexTable
              rows={COLD_LEVELS}
              source="기상청 강풍·한파 특보 기준 · 미국 기상청 Wind Chill"
            />
          </div>
        </IndexModal>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  color,
  muted,
  sub,
}: {
  label: string
  value: string
  color: string
  muted: string
  sub?: string
}) {
  return (
    <div className="text-center min-w-0">
      <p className="text-xs" style={{ color: muted }}>{label}</p>
      <p className="font-semibold mt-0.5 tabular-nums break-words" style={{ color }}>{value}</p>
      {sub && (
        <p className="text-[10px] mt-0.5 leading-tight line-clamp-2" style={{ color: muted }}>
          {sub}
        </p>
      )}
    </div>
  )
}

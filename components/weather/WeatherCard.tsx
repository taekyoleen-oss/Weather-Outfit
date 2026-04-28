'use client'

import { useState } from 'react'
import { WeatherHeroIllustration } from './WeatherHeroIllustration'
import { FreshnessBadge } from './FreshnessBadge'
import type { CurrentWeather, SunriseSunset, TimeOfDay, DustData, PreviousPeriodWeatherSummary } from '@/types/weather'
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
} from '@/lib/utils/formatWeather'

interface Props {
  weather: CurrentWeather | null
  period: TimeOfDay
  loading?: boolean
  addressLine?: string | null
  sunriseSunset?: SunriseSunset | null
  uvDisplay?: number
  dust?: DustData | null
  /** 직전에 끝난 시간대(예: 새벽) 대표 날씨 */
  previousPeriodWeather?: PreviousPeriodWeatherSummary | null
  /** 어제 동시간대·오늘 일 최저·최고 (Open-Meteo) */
  openMeteoCompare?: OpenMeteoDailyCompare | null
}

const BG_MAP: Record<TimeOfDay, string> = {
  morning: 'var(--bg-morning)',
  day: 'var(--bg-day)',
  evening: 'var(--bg-evening)',
  night: 'var(--bg-night)',
}

const TEXT_NIGHT = 'rgba(226,232,240,0.9)'

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
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
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
            onClick={onClose}
            className="p-1.5 rounded-full text-sm leading-none"
            style={{ color: 'var(--muted)', background: 'var(--surface)' }}
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
  loading,
  addressLine,
  sunriseSunset,
  uvDisplay,
  dust,
  previousPeriodWeather,
  openMeteoCompare,
}: Props) {
  const [modal, setModal] = useState<'uv' | 'heat' | null>(null)

  const isNight = period === 'night'
  const textColor = isNight ? TEXT_NIGHT : 'var(--text)'
  const mutedColor = isNight ? 'rgba(148,163,184,0.8)' : 'var(--muted)'
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

  const visLabel = weather.visibility >= 10000
    ? '10km 이상'
    : `${(weather.visibility / 1000).toFixed(1)}km`
  const visSub = weather.visibility < 1000 ? '매우 나쁨' : weather.visibility < 5000 ? '나쁨' : '좋음'

  const o3Label = o3GradeLabel(dust?.o3Grade)
  const o3Color = o3GradeColor(dust?.o3Grade)
  const o3Value = dust?.o3Value != null ? `${dust.o3Value.toFixed(3)} ppm` : undefined

  return (
    <div
      className="glass-card px-4 py-3 sm:px-6 overflow-hidden"
      style={{ background: BG_MAP[period] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0 flex-1 pr-1">
          <p className="text-sm font-semibold leading-tight" style={{ color: textColor }}>
            {weather.location}
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
          size={80}
        />
      </div>

      {/* Temperature */}
      <div className="mt-1">
        <div className="flex items-end gap-1.5">
          <span className="text-5xl font-bold leading-none tabular-nums" style={{ color: textColor }}>
            {formatTemp1(weather.temperature)}°
          </span>
          <span className="text-lg mb-0.5" style={{ color: mutedColor }}>C</span>
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

      {/* Stats grid: row1 = 체감/습도/바람, row2 = 가시거리/일출/일몰 */}
      <div className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-2 text-xs sm:text-sm">
        {/* 체감온도 with ℹ — 폭염/한파 기준 안내 */}
        <div className="text-center min-w-0 relative">
          <p className="text-xs" style={{ color: mutedColor }}>체감</p>
          <p className="font-semibold mt-0.5 tabular-nums" style={{ color: textColor }}>{formatTemp1(feels)}°</p>
          <button
            onClick={() => setModal('heat')}
            className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{ background: infoBtnBg, color: '#fff' }}
            aria-label="폭염·한파 기준 보기"
          >ℹ</button>
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

      {/* UV + 오존 하단 전용 섹션 */}
      <div
        className="mt-2.5 pt-2 flex items-center gap-4"
        style={{ borderTop: `1px solid ${isNight ? 'rgba(148,163,184,0.2)' : 'rgba(0,0,0,0.06)'}` }}
      >
        {/* 자외선 */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-base">☀️</span>
          <div className="min-w-0">
            <p className="text-[10px] leading-none mb-0.5" style={{ color: mutedColor }}>자외선</p>
            <p className="text-sm font-bold leading-none" style={{ color: uvColor(uv) }}>UV {uv}</p>
            <p className="text-[10px] mt-0.5" style={{ color: uvColor(uv) }}>{uvLabel(uv)}</p>
          </div>
        </div>

        {/* 오존 */}
        <div className="flex-1 flex items-center gap-2">
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

        {/* ℹ 기준 보기 버튼 */}
        <button
          onClick={() => setModal('uv')}
          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-opacity hover:opacity-80"
          style={{ background: infoBtnBg, color: '#fff' }}
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

'use client'

import { WeatherHeroIllustration } from './WeatherHeroIllustration'
import { FreshnessBadge } from './FreshnessBadge'
import type { CurrentWeather, SunriseSunset, TimeOfDay } from '@/types/weather'
import {
  weatherLabel,
  windDirectionLabel,
  feelsLike,
  uvLabel,
  uvColor,
  formatTime,
} from '@/lib/utils/formatWeather'

interface Props {
  weather: CurrentWeather | null
  period: TimeOfDay
  loading?: boolean
  /** 검색·GPS 등에서 넘기는 상세 주소 (없으면 표시 생략) */
  addressLine?: string | null
  sunriseSunset?: SunriseSunset | null
  /** 시간대별 보간 시 UV가 0이 될 수 있어, 카드 표시용으로 현재 관측 UV 등을 넘길 수 있음 */
  uvDisplay?: number
}

const BG_MAP: Record<TimeOfDay, string> = {
  morning: 'var(--bg-morning)',
  day: 'var(--bg-day)',
  evening: 'var(--bg-evening)',
  night: 'var(--bg-night)',
}

const TEXT_NIGHT = 'rgba(226,232,240,0.9)'

export function WeatherCard({
  weather,
  period,
  loading,
  addressLine,
  sunriseSunset,
  uvDisplay,
}: Props) {
  const isNight = period === 'night'
  const textColor = isNight ? TEXT_NIGHT : 'var(--text)'
  const mutedColor = isNight ? 'rgba(148,163,184,0.8)' : 'var(--muted)'

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
  const uv = uvDisplay ?? weather.uvIndex
  const showAddress =
    addressLine &&
    addressLine.trim() !== '' &&
    addressLine.trim() !== weather.location.trim()

  return (
    <div
      className="glass-card px-4 py-3 sm:px-6 overflow-hidden"
      style={{ background: BG_MAP[period] }}
    >
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

      <div className="mt-1">
        <div className="flex items-end gap-1.5">
          <span
            className="text-5xl font-bold leading-none tabular-nums"
            style={{ color: textColor }}
          >
            {Math.round(weather.temperature)}°
          </span>
          <span className="text-lg mb-0.5" style={{ color: mutedColor }}>C</span>
        </div>
        <p className="text-sm mt-0.5 leading-snug" style={{ color: textColor }}>
          {weatherLabel(weather.skyCode, weather.ptyCode)}
        </p>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-2 text-xs sm:text-sm">
        <Stat label="체감" value={`${feels}°`} color={textColor} muted={mutedColor} />
        <Stat label="습도" value={`${weather.humidity}%`} color={textColor} muted={mutedColor} />
        <Stat
          label="바람"
          value={`${windDirectionLabel(weather.windDirection)} ${weather.windSpeed}m/s`}
          color={textColor}
          muted={mutedColor}
        />
        <Stat
          label="자외선"
          value={`UV ${uv}`}
          color={uvColor(uv)}
          muted={mutedColor}
          sub={uvLabel(uv)}
          subMuted
        />
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
    </div>
  )
}

function Stat({
  label,
  value,
  color,
  muted,
  sub,
  subMuted,
}: {
  label: string
  value: string
  color: string
  muted: string
  sub?: string
  /** 보조 텍스트를 더 흐리게 (자외선 등급 등) */
  subMuted?: boolean
}) {
  return (
    <div className="text-center min-w-0">
      <p className="text-xs" style={{ color: muted }}>{label}</p>
      <p className="font-semibold mt-0.5 tabular-nums break-words" style={{ color }}>{value}</p>
      {sub && (
        <p
          className="text-[10px] mt-0.5 leading-tight line-clamp-2"
          style={{ color: subMuted ? muted : color }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

'use client'

import { WeatherHeroIllustration } from './WeatherHeroIllustration'
import { FreshnessBadge } from './FreshnessBadge'
import type { CurrentWeather, TimeOfDay } from '@/types/weather'
import { weatherLabel, windDirectionLabel, feelsLike } from '@/lib/utils/formatWeather'

interface Props {
  weather: CurrentWeather | null
  period: TimeOfDay
  loading?: boolean
}

const BG_MAP: Record<TimeOfDay, string> = {
  morning: 'var(--bg-morning)',
  day: 'var(--bg-day)',
  evening: 'var(--bg-evening)',
  night: 'var(--bg-night)',
}

const TEXT_NIGHT = 'rgba(226,232,240,0.9)'

export function WeatherCard({ weather, period, loading }: Props) {
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

  return (
    <div
      className="glass-card px-4 py-3 sm:px-6 overflow-hidden"
      style={{ background: BG_MAP[period] }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: mutedColor }}>
            {weather.location}
          </p>
          <FreshnessBadge fetchedAt={weather.fetchedAt} />
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

      <div className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-1 text-xs sm:text-sm">
        <Stat label="체감" value={`${feels}°`} color={textColor} muted={mutedColor} />
        <Stat label="습도" value={`${weather.humidity}%`} color={textColor} muted={mutedColor} />
        <Stat
          label="바람"
          value={`${windDirectionLabel(weather.windDirection)} ${weather.windSpeed}m/s`}
          color={textColor}
          muted={mutedColor}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, color, muted }: { label: string; value: string; color: string; muted: string }) {
  return (
    <div className="text-center">
      <p className="text-xs" style={{ color: muted }}>{label}</p>
      <p className="font-semibold mt-0.5" style={{ color }}>{value}</p>
    </div>
  )
}

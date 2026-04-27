'use client'

import { HighlightCard } from './HighlightCard'
import type { CurrentWeather, DustData, SunriseSunset, WeatherAlert } from '@/types/weather'
import { uvLabel, uvColor, dustGradeLabel, dustGradeColor, formatTime, windDirectionLabel } from '@/lib/utils/formatWeather'

interface Props {
  weather: CurrentWeather | null
  dust?: DustData | null
  sunriseSunset?: SunriseSunset | null
  alerts?: WeatherAlert[]
  loading?: boolean
  /** 왼쪽 사이드: 3열 2~3행 컴팩트 레이아웃 */
  compact?: boolean
}

export function HighlightsGrid({ weather, dust, sunriseSunset, alerts, loading, compact }: Props) {
  const gridClass = compact
    ? 'grid grid-cols-3 gap-2'
    : 'grid grid-cols-2 md:grid-cols-4 gap-4'
  const skeletonH = compact ? 'h-[72px]' : 'h-[100px]'

  if (loading || !weather) {
    return (
      <div>
        {compact && (
          <h2
            className="text-xs font-semibold mb-2"
            style={{ color: 'var(--muted)' }}
          >
            Today&apos;s Highlights
          </h2>
        )}
        <div className={gridClass}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`glass-card p-4 ${skeletonH} animate-pulse`}>
              <div className="h-2.5 w-12 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const alertCount = alerts?.length ?? 0

  const cards = [
    {
      icon: '🌡',
      label: '자외선 지수',
      value: `UV ${weather.uvIndex}`,
      sub: uvLabel(weather.uvIndex),
      accent: uvColor(weather.uvIndex),
    },
    {
      icon: '💨',
      label: '바람',
      value: `${weather.windSpeed}m/s`,
      sub: `${windDirectionLabel(weather.windDirection)}풍`,
      accent: 'var(--cool)',
    },
    {
      icon: '🌅',
      label: '일출 / 일몰',
      value: sunriseSunset
        ? `${formatTime(sunriseSunset.sunrise)}`
        : '--:--',
      sub: sunriseSunset ? `일몰 ${formatTime(sunriseSunset.sunset)}` : '',
      accent: 'var(--accent)',
    },
    {
      icon: '💧',
      label: '습도',
      value: `${weather.humidity}%`,
      sub: weather.humidity > 70 ? '습함' : weather.humidity < 30 ? '건조' : '보통',
      accent: 'var(--humidity)',
    },
    {
      icon: '👁',
      label: '가시거리',
      value: weather.visibility >= 10000
        ? '10km 이상'
        : `${(weather.visibility / 1000).toFixed(1)}km`,
      sub: weather.visibility < 1000 ? '매우 나쁨' : weather.visibility < 5000 ? '나쁨' : '좋음',
    },
    {
      icon: '🏭',
      label: '대기질',
      value: dust ? dustGradeLabel(dust.pm10Grade) : '--',
      sub: dust ? `PM10: ${dust.pm10Value}μg/m³` : '',
      accent: dust ? dustGradeColor(dust.pm10Grade) : 'var(--muted)',
    },
    {
      icon: '🫁',
      label: '초미세먼지',
      value: dust ? dustGradeLabel(dust.pm25Grade) : '--',
      sub: dust ? `PM2.5: ${dust.pm25Value}μg/m³` : '',
      accent: dust ? dustGradeColor(dust.pm25Grade) : 'var(--muted)',
    },
    {
      icon: '⚠️',
      label: '기상특보',
      value: alertCount > 0 ? `${alertCount}건` : '없음',
      sub: alertCount > 0 ? alerts![0].type : '안전',
      accent: alertCount > 0 ? 'var(--danger)' : 'var(--success)',
    },
  ]

  return (
    <div>
      <h2
        className={compact ? 'text-xs font-semibold mb-2' : 'text-sm font-semibold mb-3'}
        style={{ color: 'var(--muted)' }}
      >
        Today&apos;s Highlights
      </h2>
      <div className={gridClass}>
        {cards.map((c) => (
          <HighlightCard key={c.label} compact={compact} {...c} />
        ))}
      </div>
    </div>
  )
}

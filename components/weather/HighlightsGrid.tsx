'use client'

import { HighlightCard } from './HighlightCard'
import type { CurrentWeather, DustData, WeatherAlert } from '@/types/weather'
import { dustGradeLabel, dustGradeColor } from '@/lib/utils/formatWeather'
import { KMA_WEATHER_WARN_PAGE } from '@/lib/weather/kma-alert'

interface Props {
  weather: CurrentWeather | null
  dust?: DustData | null
  alerts?: WeatherAlert[]
  loading?: boolean
  /** 왼쪽 사이드: 3열 2~3행 컴팩트 레이아웃 */
  compact?: boolean
}

export function HighlightsGrid({ weather, dust, alerts, loading, compact }: Props) {
  const gridClass = compact
    ? 'grid grid-cols-4 gap-1.5'
    : 'grid grid-cols-2 md:grid-cols-4 gap-4'
  const skeletonH = compact ? 'h-[60px]' : 'h-[100px]'

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
          {Array.from({ length: 4 }).map((_, i) => (
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
      href: alertCount > 0 ? KMA_WEATHER_WARN_PAGE : undefined,
    },
  ]

  return (
    <div>
      <h2
        className={compact ? 'text-xs font-semibold mb-1.5' : 'text-sm font-semibold mb-3'}
        style={{ color: 'var(--muted)' }}
      >
        Highlights
      </h2>
      <div className={gridClass}>
        {cards.map((c) => (
          <HighlightCard key={c.label} compact={compact} {...c} />
        ))}
      </div>
    </div>
  )
}

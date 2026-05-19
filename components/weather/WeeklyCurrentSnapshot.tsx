'use client'

import type { CurrentWeather, DustData } from '@/types/weather'
import type { OpenMeteoDailyCompare } from '@/lib/weather/openMeteoCompare'
import { weatherLabel, dustGradeLabel, dustGradeColor, windDirectionLabel, pickIllustKey, illustFile } from '@/lib/utils/formatWeather'
import Image from 'next/image'

interface Props {
  weather: CurrentWeather | null
  dust: DustData | null
  /** 어제 같은 시간 비교 (옵션). null이면 비교 카드는 숨김 */
  compare?: OpenMeteoDailyCompare | null
  /** 위치명 (헤더에 표시할 수 있음) */
  locationName?: string
}

function compareLabel(today: number, yesterday: number | null | undefined): string {
  if (yesterday == null || !Number.isFinite(yesterday)) return ''
  const diff = today - yesterday
  if (Math.abs(diff) < 0.5) return '어제와 동일'
  const rounded = Math.round(Math.abs(diff))
  return diff > 0 ? `어제보다 ${rounded}° 높음` : `어제보다 ${rounded}° 낮음`
}

function gradeFace(grade?: string): string {
  switch (dustGradeLabel(grade ?? '2')) {
    case '좋음': return '😊'
    case '보통': return '🙂'
    case '나쁨': return '😷'
    case '매우나쁨': return '😨'
    default: return '🙂'
  }
}

export function WeeklyCurrentSnapshot({ weather, dust, compare }: Props) {
  if (!weather) {
    return (
      <div
        className="rounded-2xl p-4 h-32 animate-pulse"
        style={{ background: 'var(--colors-surface-soft)' }}
      />
    )
  }
  const tempInt = Math.round(weather.temperature)
  const label = weatherLabel(weather.skyCode, weather.ptyCode)
  const cmp = compareLabel(weather.temperature, compare?.yesterdaySameHourTemp ?? null)
  const illustKey = pickIllustKey(weather.skyCode, weather.ptyCode)
  const heroIcon = `/illust/weather/${illustFile(illustKey, 'day')}.svg`
  const windLabel = `${windDirectionLabel(weather.windDirection)}풍`

  const cards: { label: string; main: string; sub?: string; color?: string }[] = [
    {
      label: '미세',
      main: gradeFace(dust?.pm10Grade),
      sub: dustGradeLabel(dust?.pm10Grade ?? '2'),
      color: dustGradeColor(dust?.pm10Grade ?? '2'),
    },
    {
      label: '초미세',
      main: gradeFace(dust?.pm25Grade),
      sub: dustGradeLabel(dust?.pm25Grade ?? '2'),
      color: dustGradeColor(dust?.pm25Grade ?? '2'),
    },
    {
      label: '체감',
      main: `${Math.round(weather.feelsLike)}°`,
    },
    {
      label: windLabel,
      main: `${weather.windSpeed.toFixed(1)}`,
      sub: 'm/s',
    },
  ]

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--surface-border)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Image src={heroIcon} alt={label} width={56} height={56} className="h-14 w-14 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold leading-none tabular-nums" style={{ color: 'var(--text)' }}>{tempInt}</span>
            <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>°C</span>
            <span className="text-sm font-semibold ml-1" style={{ color: 'var(--muted)' }}>{label}</span>
          </div>
          {cmp && (
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{cmp}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {cards.map((c, i) => (
          <div
            key={i}
            className="rounded-xl px-2 py-2 text-center"
            style={{ background: 'var(--colors-surface-filter)', border: '1px solid var(--border)' }}
          >
            <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--muted)' }}>{c.label}</p>
            <p className="text-base font-bold leading-tight" style={{ color: c.color ?? 'var(--text)' }}>{c.main}</p>
            {c.sub && <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{c.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

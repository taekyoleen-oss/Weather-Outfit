'use client'

import { useState } from 'react'
import { HighlightCard } from './HighlightCard'
import type { CurrentWeather, DustData, WeatherAlert, PreviousPeriodWeatherSummary } from '@/types/weather'
import { formatTemp1 } from '@/lib/utils/formatWeather'
import { dustGradeLabel, dustGradeColor } from '@/lib/utils/formatWeather'
import { KMA_WEATHER_WARN_PAGE } from '@/lib/weather/kma-alert'

interface Props {
  weather: CurrentWeather | null
  dust?: DustData | null
  alerts?: WeatherAlert[]
  loading?: boolean
  compact?: boolean
  previousPeriodWeather?: PreviousPeriodWeatherSummary | null
}

// ─── 기상 지수 안내 데이터 ─────────────────────────────────────────────────────
// 근거: weather-outdoor-clothing-guide.md 다. 공식 위험 기준

interface IndexRow { level: string; range: string; colorHex: string; clothing: string }

const PM10_LEVELS: IndexRow[] = [
  { level: '좋음', range: '0–30 ㎍/㎥', colorHex: '#22C55E', clothing: '일반 외출 가능.' },
  { level: '보통', range: '31–80 ㎍/㎥', colorHex: '#84CC16', clothing: '민감군은 몸 상태에 따라 활동 조절.' },
  { level: '나쁨', range: '81–150 ㎍/㎥', colorHex: '#F97316', clothing: 'KF80 마스크 착용. 조깅·자전거·등산 등 호흡량 많은 운동 자제.' },
  { level: '매우나쁨', range: '151+ ㎍/㎥', colorHex: '#EF4444', clothing: '실외활동 최소화. 민감군 가급적 실내.' },
]

const PM25_LEVELS: IndexRow[] = [
  { level: '좋음', range: '0–15 ㎍/㎥', colorHex: '#22C55E', clothing: '일반 외출 가능.' },
  { level: '보통', range: '16–35 ㎍/㎥', colorHex: '#84CC16', clothing: '민감군은 몸 상태에 따라 활동 조절.' },
  { level: '나쁨', range: '36–75 ㎍/㎥', colorHex: '#F97316', clothing: 'KF94 마스크 착용. 호흡량 많은 운동 자제.' },
  { level: '매우나쁨', range: '76+ ㎍/㎥', colorHex: '#EF4444', clothing: '실외활동 최소화. 가급적 실내 활동.' },
]

function IndexModal({ title, rows, source, onClose }: {
  title: string
  rows: IndexRow[]
  source: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-sm max-h-[75dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl flex flex-col"
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
        <div className="flex-1 overflow-y-auto px-4 py-3">
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
                <div className="w-[88px] flex-shrink-0">
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
          <p className="text-[9px] mt-2" style={{ color: 'var(--muted)' }}>📋 {source}</p>
        </div>
      </div>
    </div>
  )
}

export function HighlightsGrid({ weather, dust, alerts, loading, compact, previousPeriodWeather }: Props) {
  const [modal, setModal] = useState<'pm10' | 'pm25' | null>(null)

  // 가시거리는 WeatherCard로 이동 → 여기서는 대기질·초미세먼지·기상특보 3항목
  const gridClass = compact
    ? 'grid grid-cols-3 gap-1.5'
    : 'grid grid-cols-3 md:grid-cols-3 gap-4'
  const skeletonH = compact ? 'h-[60px]' : 'h-[100px]'

  if (loading || !weather) {
    return (
      <div>
        {compact && (
          <h2 className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
            Today&apos;s Highlights
          </h2>
        )}
        <div className={gridClass}>
          {Array.from({ length: 3 }).map((_, i) => (
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

  return (
    <div>
      <h2
        className={compact ? 'text-xs font-semibold mb-1.5' : 'text-sm font-semibold mb-3'}
        style={{ color: 'var(--muted)' }}
      >
        Highlights
      </h2>
      <div className={gridClass}>
        {/* 대기질 (PM10) */}
        <HighlightCard
          compact={compact}
          icon="🏭"
          label="대기질 PM10"
          value={dust ? dustGradeLabel(dust.pm10Grade) : '--'}
          sub={dust ? `${dust.pm10Value} ㎍/㎥` : ''}
          accent={dust ? dustGradeColor(dust.pm10Grade) : 'var(--muted)'}
          onInfoClick={() => setModal('pm10')}
        />

        {/* 초미세먼지 (PM2.5) */}
        <HighlightCard
          compact={compact}
          icon="🫁"
          label="초미세먼지 PM2.5"
          value={dust ? dustGradeLabel(dust.pm25Grade) : '--'}
          sub={dust ? `${dust.pm25Value} ㎍/㎥` : ''}
          accent={dust ? dustGradeColor(dust.pm25Grade) : 'var(--muted)'}
          onInfoClick={() => setModal('pm25')}
        />

        {/* 기상특보 */}
        <HighlightCard
          compact={compact}
          icon="⚠️"
          label="기상특보"
          value={alertCount > 0 ? `${alertCount}건` : '없음'}
          sub={alertCount > 0 ? alerts![0].type : '안전'}
          accent={alertCount > 0 ? 'var(--danger)' : 'var(--success)'}
          href={alertCount > 0 ? KMA_WEATHER_WARN_PAGE : undefined}
        />
      </div>

      {previousPeriodWeather && (
        <div
          className={`mt-2 glass-card ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
          style={{ borderColor: 'var(--border)' }}
        >
          <p className={compact ? 'text-[10px] font-medium' : 'text-xs font-medium'} style={{ color: 'var(--muted)' }}>
            직전 시간대 · {previousPeriodWeather.periodLabel}
          </p>
          <p
            className={`mt-1 font-semibold tabular-nums leading-snug ${compact ? 'text-xs' : 'text-sm'}`}
            style={{ color: 'var(--text)' }}
          >
            <span className="mr-0.5">{previousPeriodWeather.emoji}</span>
            {previousPeriodWeather.weatherLabel}
            <span className="mx-1 font-normal" style={{ color: 'var(--muted)' }}>·</span>
            {formatTemp1(previousPeriodWeather.temperature)}°
            <span className="font-normal mx-1" style={{ color: 'var(--muted)' }}>/</span>
            체감 {formatTemp1(previousPeriodWeather.feelsLike)}°
          </p>
        </div>
      )}

      {/* PM10 안내 모달 */}
      {modal === 'pm10' && (
        <IndexModal
          title="🏭 미세먼지 PM10 기준"
          rows={PM10_LEVELS}
          source="에어코리아 미세먼지 행동요령"
          onClose={() => setModal(null)}
        />
      )}

      {/* PM2.5 안내 모달 */}
      {modal === 'pm25' && (
        <IndexModal
          title="🫁 초미세먼지 PM2.5 기준"
          rows={PM25_LEVELS}
          source="에어코리아 미세먼지 행동요령"
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

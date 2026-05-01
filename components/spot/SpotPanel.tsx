'use client'

import { useEffect, useRef, useState } from 'react'
import { LocationSearchBar } from '@/components/weather/LocationSearchBar'
import { GolfHourlyTimeline } from './GolfHourlyTimeline'
import type { GolfHourlyRow } from './GolfHourlyTimeline'
import { FairwayWindCard } from './FairwayWindCard'
import { GolfOutfitCard, type OutfitSummary } from './GolfOutfitCard'
import { GolfRiskAlerts } from './GolfRiskAlerts'
import type { LocationInfo } from '@/types/location'
import type { GolfScore } from '@/lib/spot/golfScore'

interface LivingIdxOut {
  value: number
  grade?: string
}

interface SpotApiResponse {
  spot: { name: string; address?: string; lat: number; lon: number; nx: number; ny: number }
  observed: {
    baseDate: string
    baseTime: string
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: number
    ptyCode: string
    rn1: number
  } | null
  tmnToday: number | null
  tmxToday: number | null
  hourly: GolfHourlyRow[]
  precip10m: { minuteOffset: number; timeKst: string; precipProb: number; precipMm: number }[]
  lightningNow: { level: 'none' | 'watch' | 'warning'; message: string; source: string }
  mountainHourly: {
    fcstYmd: string
    fcstHour: number
    tempC: number
    windMs: number
    pop: number
    visibilityKm: number | null
    level: 'good' | 'caution' | 'danger'
  }[]
  wildfireHourly: {
    fcstYmd: string
    fcstHour: number
    score: number
    level: 'low' | 'moderate' | 'high' | 'very_high'
  }[]
  alerts: { type: string; level: string; message: string; isLightningRelated: boolean }[]
  indices: {
    uv: LivingIdxOut | null
    senTa: LivingIdxOut | null
    wct: LivingIdxOut | null
    airDiffusion: LivingIdxOut | null
  }
  scoreNow: GolfScore
  bestTeeHours: number[]
  outfit: OutfitSummary | null
  fetchedAt: number
  error?: string
}

function lightningTone(level: SpotApiResponse['lightningNow']['level']) {
  if (level === 'warning') return { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.35)', text: '#b91c1c', label: '낙뢰 경계' }
  if (level === 'watch') return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#b45309', label: '낙뢰 주의' }
  return { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.3)', text: '#15803d', label: '안정' }
}

function mountainLevelText(v: 'good' | 'caution' | 'danger'): string {
  if (v === 'danger') return '위험'
  if (v === 'caution') return '주의'
  return '양호'
}

function wildfireLevelText(v: 'low' | 'moderate' | 'high' | 'very_high'): string {
  if (v === 'very_high') return '매우 높음'
  if (v === 'high') return '높음'
  if (v === 'moderate') return '보통'
  return '낮음'
}

interface Props {
  initialSpot?: LocationInfo | null
  anchorLocation?: LocationInfo | null
  compact?: boolean
  showHeader?: boolean
}

function LivingIndicesRow({ indices, compact }: { indices: SpotApiResponse['indices']; compact: boolean }) {
  const uv =
    indices.uv && Number.isFinite(indices.uv.value)
      ? `${indices.uv.value}${indices.uv.grade ? ` (${indices.uv.grade})` : ''}`
      : '--'
  const senTa = indices.senTa && Number.isFinite(indices.senTa.value) ? String(indices.senTa.value) : '--'
  const wct = indices.wct && Number.isFinite(indices.wct.value) ? String(indices.wct.value) : '--'
  const air =
    indices.airDiffusion && Number.isFinite(indices.airDiffusion.value)
      ? String(indices.airDiffusion.value)
      : '--'

  const parts = [`자외선 ${uv}`, `여름체감 ${senTa}`, `겨울체감 ${wct}`, `대기정체 ${air}`]
  return (
    <div
      className={`rounded-xl ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
      style={{ background: 'rgba(91,141,238,0.06)', border: '1px solid var(--border)' }}
    >
      <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
        기상청 생활기상지수 (해당 지역 근사)
      </p>
      <p className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`} style={{ color: 'var(--text)' }}>
        {parts.join(' · ')}
      </p>
    </div>
  )
}

export function SpotPanel({
  initialSpot = null,
  anchorLocation = null,
  compact = false,
  showHeader = true,
}: Props) {
  const [spot, setSpot] = useState<LocationInfo | null>(initialSpot ?? null)
  const [data, setData] = useState<SpotApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (spot) return
    if (!anchorLocation) return
    setSpot(anchorLocation)
  }, [anchorLocation, spot])

  useEffect(() => {
    if (!spot) return
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setLoading(true)
    setError(null)
    setData(null)

    const url = `/api/weather/spot?nx=${spot.nx}&ny=${spot.ny}&lat=${spot.lat}&lon=${spot.lon}&name=${encodeURIComponent(spot.name)}`
    fetch(url, { signal: ac.signal })
      .then((r) => r.json())
      .then((d: SpotApiResponse) => {
        if (ac.signal.aborted) return
        if (d?.error) setError(d.error)
        else setData(d)
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        setError('정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })

    return () => ac.abort()
  }, [spot])

  return (
    <section className={compact ? 'space-y-2.5' : 'space-y-3'} aria-label="골프 라운드 날씨">
      {showHeader && (
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h2 className={`font-bold ${compact ? 'text-sm' : 'text-base'}`} style={{ color: 'var(--primary)' }}>
            골프·라운드
          </h2>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
            KMA 초단기·단기·지수
          </span>
        </div>
      )}

      <LocationSearchBar onSelect={setSpot} />

      {!spot && !loading && (
        <div
          className="rounded-2xl p-4 text-center text-xs"
          style={{
            background: 'var(--surface, rgba(255,255,255,0.6))',
            border: '1px dashed var(--border)',
            color: 'var(--muted)',
          }}
        >
          장소를 검색하면 <b>라운드 적합도</b>, 시간대별 점수, 바람, 복장, 기상특보를
          <br />
          기상청 API 기반으로 보여 드립니다. (골프장 외 장소도 조회 가능)
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--danger, #b91c1c)',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && spot && data && (
        <>
          {data.observed && (
            <FairwayWindCard
              windSpeedMs={data.observed.windSpeed}
              vecDeg={data.observed.windDirection}
              score={data.scoreNow}
              bestTeeHours={data.bestTeeHours}
              compact={compact}
            />
          )}
          <GolfHourlyTimeline hourly={data.hourly} compact={compact} />
          <div
            className={`rounded-2xl ${compact ? 'p-3' : 'p-4'}`}
            style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}
          >
            <p className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--primary)' }}>
              실시간 낙뢰 · 10분 강수 예측
            </p>
            <div
              className="mt-2 rounded-lg px-2.5 py-2"
              style={{
                background: lightningTone(data.lightningNow.level).bg,
                border: `1px solid ${lightningTone(data.lightningNow.level).border}`,
                color: lightningTone(data.lightningNow.level).text,
              }}
            >
              <p className="text-xs font-semibold">
                {lightningTone(data.lightningNow.level).label}
              </p>
              <p className="text-[11px] mt-1 leading-snug">{data.lightningNow.message}</p>
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {data.precip10m.map((p) => (
                <div
                  key={`${p.timeKst}-${p.minuteOffset}`}
                  className="flex-shrink-0 rounded-lg px-2 py-1.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 70 }}
                >
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>{p.timeKst}</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--humidity)' }}>{p.precipProb}%</p>
                  <p className="text-[10px]" style={{ color: 'var(--text)' }}>{p.precipMm.toFixed(1)}mm</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
              10분 예측은 초단기(현재+다음 1시간) 기반 보간값입니다.
            </p>
          </div>
          <div
            className={`rounded-2xl ${compact ? 'p-3' : 'p-4'}`}
            style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}
          >
            <p className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--primary)' }}>
              산악 기상 · 산불 위험 (시간별)
            </p>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {data.mountainHourly.map((m, i) => (
                <div
                  key={`${m.fcstYmd}-${m.fcstHour}-${i}`}
                  className="flex-shrink-0 rounded-lg px-2 py-1.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 88 }}
                >
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {String(m.fcstHour).padStart(2, '0')}시
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text)' }}>
                    {m.tempC.toFixed(0)}° · {m.windMs.toFixed(1)}m/s
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--humidity)' }}>POP {Math.round(m.pop)}%</p>
                  <p className="text-[10px] font-semibold" style={{ color: m.level === 'danger' ? '#b91c1c' : m.level === 'caution' ? '#b45309' : '#15803d' }}>
                    산악 {mountainLevelText(m.level)}
                  </p>
                  {data.wildfireHourly[i] && (
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      산불 {wildfireLevelText(data.wildfireHourly[i].level)} ({data.wildfireHourly[i].score})
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <LivingIndicesRow indices={data.indices} compact={compact} />
          {data.outfit && <GolfOutfitCard outfit={data.outfit} compact={compact} />}
          <GolfRiskAlerts alerts={data.alerts} compact={compact} />
        </>
      )}
    </section>
  )
}

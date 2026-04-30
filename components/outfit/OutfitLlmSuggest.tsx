'use client'

import { useMemo, useRef, useState } from 'react'
import type { CurrentWeather, DustData } from '@/types/weather'
import type { ActivityType, GenderType, OutfitResult as OutfitResultType } from '@/types/outfit'
import type { TerrainType } from '@/types/location'

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  urban_walk: '산책·도보',
  running: '달리기·조깅',
  cycling: '자전거',
  golf: '골프',
  hiking: '등산·트레킹',
  picnic: '소풍·피크닉',
  river: '강변',
  beach: '해변',
  ski: '스키·스노보드',
  tennis: '테니스·라켓',
}

function dustGradeLabel(g: string): string {
  switch (g) {
    case '1': return '좋음'
    case '2': return '보통'
    case '3': return '나쁨'
    case '4': return '매우 나쁨'
    default: return g
  }
}

function worseDustGrade(a?: string, b?: string): string {
  const order = ['1', '2', '3', '4']
  const ia = Math.max(0, order.indexOf(a ?? '2'))
  const ib = Math.max(0, order.indexOf(b ?? '2'))
  return order[Math.max(ia, ib)] ?? '2'
}

function terrainLabel(t: TerrainType | string): string {
  const m: Record<string, string> = {
    urban: '도심',
    open_park: '공원·운동장',
    golf_course: '골프장',
    riverside: '한강·강변',
    coastal: '해안',
    forest: '숲',
    mountain_ridge: '산 능선·고지',
    highland: '고원',
  }
  return m[t] ?? String(t)
}

interface Props {
  weather: CurrentWeather
  dust: DustData | null | undefined
  activity: ActivityType
  gender: GenderType
  terrain: TerrainType | string
  hour: number
  durationHours: number
  result: OutfitResultType
  /** OutfitPanel 민감도 보정(체감에 더함) — 룰 엔진과 동일하게 LLM 입력에 반영 */
  feelsLikeSensitivity: number
}

type LlmState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; explanation: string; outfitSuggestions: { area: string; detail: string }[] }
  | { status: 'error'; message: string }

export function OutfitLlmSuggest({
  weather,
  dust,
  activity,
  gender,
  terrain,
  hour,
  durationHours,
  result,
  feelsLikeSensitivity,
}: Props) {
  const [state, setState] = useState<LlmState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)
  const reqKey = useMemo(
    () =>
      JSON.stringify({
        loc: weather.location,
        t: weather.fetchedAt,
        act: activity,
        g: gender,
        tr: terrain,
        h: hour,
        d: durationHours,
        fl: Math.round((weather.feelsLike + feelsLikeSensitivity) * 10) / 10,
        sens: feelsLikeSensitivity,
        zone: result.tempZone,
        danger: result.dangerLevel,
        cancel: result.cancelActivity,
        items: result.items.map((i) => i.id).join(','),
      }),
    [
      weather.location,
      weather.fetchedAt,
      weather.feelsLike,
      feelsLikeSensitivity,
      activity,
      gender,
      terrain,
      hour,
      durationHours,
      result.tempZone,
      result.dangerLevel,
      result.cancelActivity,
      result.items,
    ],
  )

  async function requestSuggestion() {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setState({ status: 'loading' })

    const d = durationHours > 0 ? durationHours : 1
    const feels = weather.feelsLike + feelsLikeSensitivity
    const body = {
      locationName: weather.location,
      temperature: weather.temperature,
      feelsLike: feels,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection,
      uvIndex: weather.uvIndex,
      precipitation: weather.precipitation,
      ptyCode: weather.ptyCode,
      skyCode: weather.skyCode,
      pm10Value: dust?.pm10Value,
      pm25Value: dust?.pm25Value,
      dustGradeLabel: dustGradeLabel(worseDustGrade(dust?.pm10Grade, dust?.pm25Grade)),
      o3GradeLabel: dust?.o3Grade ? dustGradeLabel(dust.o3Grade) : undefined,
      activityLabel: ACTIVITY_LABEL[activity],
      genderLabel: gender === 'male' ? '남성' : '여성',
      terrainLabel: terrainLabel(terrain),
      hour,
      durationHours: d,
      layerLabel: result.layerLabel,
      tempZone: result.tempZone,
      ruleRequiredNames: result.items.filter((i) => i.required).map((i) => i.name),
      ruleOptionalNames: result.items.filter((i) => !i.required).map((i) => i.name),
      dangerLevel: result.dangerLevel,
      cancelActivity: result.cancelActivity,
      dangerSummary: result.dangerReasons.map((s) => s.replace(/\s*\([^)]*\)\s*$/, '').slice(0, 120)),
      tips: result.tips,
      uvAlert: result.uvAlert,
      dustAlert: result.dustAlert,
      rainAlert: result.rainAlert,
      windAlert: result.windAlert,
    }

    try {
      const r = await fetch('/api/outfit-llm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      })
      const j = (await r.json()) as {
        error?: string
        message?: string
        detail?: string
        explanation?: string
        outfitSuggestions?: { area: string; detail: string }[]
      }
      if (ac.signal.aborted) return
      if (!r.ok) {
        if (j.error === 'no_api_key') {
          setState({ status: 'error', message: j.message ?? 'AI API 키가 없습니다.' })
          return
        }
        const extra = j.detail ? ` (${j.detail})` : ''
        setState({
          status: 'error',
          message: `${j.message ?? 'AI 제안을 불러오지 못했습니다.'}${extra}`,
        })
        return
      }
      if (j.explanation && j.outfitSuggestions?.length) {
        setState({
          status: 'ok',
          explanation: j.explanation,
          outfitSuggestions: j.outfitSuggestions,
        })
      } else {
        setState({ status: 'error', message: j.message ?? '응답이 올바르지 않습니다.' })
      }
    } catch (e) {
      const err = e as Error
      if (ac.signal.aborted || err.name === 'AbortError') return
      setState({ status: 'error', message: '네트워크 오류로 AI 제안을 불러오지 못했습니다.' })
    }
  }

  return (
    <div
      className="rounded-xl p-3 sm:p-4 space-y-3 mt-4"
      style={{ background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.22)' }}
    >
      <div>
        <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
          AI 맞춤 제안
        </h3>
        <p className="text-[10px] sm:text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
          위 복장은 앱 가이드라인·룰 기준이며, 아래는 동일한 날씨·미세먼지·바람·활동 시간·활동 종류를 반영한
          보조 설명과 착용 아이디어입니다. (Claude API)
        </p>
        <button
          type="button"
          onClick={requestSuggestion}
          disabled={state.status === 'loading'}
          className="mt-2 text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-60"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          {state.status === 'loading' ? 'AI 제안 생성 중…' : state.status === 'ok' ? 'AI 제안 다시 생성' : 'AI 맞춤 제안 생성'}
        </button>
      </div>

      {state.status === 'loading' && (
        <p className="text-xs animate-pulse" style={{ color: 'var(--muted)' }}>
          날씨·활동 조건을 반영해 제안을 작성하는 중…
        </p>
      )}

      {state.status === 'error' && (
        <p className="text-xs leading-relaxed" style={{ color: '#B45309' }}>
          {state.message}
        </p>
      )}

      {state.status === 'ok' && (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
              제안 설명
            </p>
            {state.explanation.split(/\n+/).filter(Boolean).map((para, i) => (
              <p key={i} className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                {para}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              이에 맞춘 복장·준비 제안
            </p>
            <ul className="space-y-1.5">
              {state.outfitSuggestions.map((row, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm leading-snug flex gap-2 rounded-lg px-2 py-1.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <span className="font-semibold flex-shrink-0 w-14 sm:w-16" style={{ color: 'var(--accent)' }}>
                    {row.area}
                  </span>
                  <span style={{ color: 'var(--text)' }}>{row.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

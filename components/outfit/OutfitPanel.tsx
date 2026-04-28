'use client'

import { useState, useMemo } from 'react'
import { ActivitySelector } from './ActivitySelector'
import { GenderToggle } from './GenderToggle'
import { OutfitResult } from './OutfitResult'
import { recommendOutfit } from '@/lib/outfit/recommender'
import type { ActivityType, GenderType } from '@/types/outfit'
import type { CurrentWeather, DustData } from '@/types/weather'
import type { TerrainType } from '@/types/location'

interface Props {
  weather: CurrentWeather | null
  dust?: DustData | null
  terrain: TerrainType
  hour: number
}

type SensitivityLevel = -2 | 0 | 2

const SENSITIVITY_OPTIONS: { value: SensitivityLevel; label: string; emoji: string; desc: string }[] = [
  { value: -2, label: '추위 탐', emoji: '🥶', desc: '추위를 많이 타요' },
  { value: 0,  label: '보통',    emoji: '😊', desc: '평균 체감' },
  { value: 2,  label: '더위 탐', emoji: '🥵', desc: '더위를 많이 타요' },
]

function loadPref<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function savePref(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function OutfitPanel({ weather, dust, terrain, hour }: Props) {
  const [activity, setActivity] = useState<ActivityType>('urban_walk')
  const [gender, setGender] = useState<GenderType>(() => loadPref('wf:gender', 'male'))
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(() => loadPref('wf:sensitivity', 0) as SensitivityLevel)

  function handleActivity(a: ActivityType) { setActivity(a); savePref('wf:activity', a) }
  function handleGender(g: GenderType) { setGender(g); savePref('wf:gender', g) }
  function handleSensitivity(s: SensitivityLevel) { setSensitivity(s); savePref('wf:sensitivity', s) }

  const result = useMemo(() => {
    if (!weather) return null
    // 민감도 보정: 추위 탐(-2) → 체감을 낮게 계산해 따뜻한 복장 추천
    const adjustedFeelsLike = weather.feelsLike - sensitivity
    return recommendOutfit({
      temperature: weather.temperature,
      feelsLike: adjustedFeelsLike,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      uvIndex: weather.uvIndex,
      ptyCode: weather.ptyCode,
      precipitation: weather.precipitation,
      dustGrade: dust?.pm10Grade ?? '2',
      o3Grade: dust?.o3Grade,
      activity,
      gender,
      hour,
      duration: 2,
      terrain,
    })
  }, [weather, dust, activity, gender, hour, terrain, sensitivity])

  return (
    <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-5 min-w-0 max-w-full overflow-x-hidden">
      <h2 className="text-base font-bold" style={{ color: 'var(--primary)' }}>
        복장 추천 설정
      </h2>

      <ActivitySelector value={activity} onChange={handleActivity} />

      <div className="border-t" style={{ borderColor: 'var(--border)' }} />

      <GenderToggle value={gender} onChange={handleGender} />

      <div className="border-t" style={{ borderColor: 'var(--border)' }} />

      {/* 추위/더위 민감도 설정 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>체감 민감도</p>
        <div className="flex gap-2">
          {SENSITIVITY_OPTIONS.map((opt) => {
            const active = sensitivity === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleSensitivity(opt.value)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center transition-all"
                style={{
                  background: active ? 'var(--primary)' : 'var(--surface)',
                  border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  color: active ? '#fff' : 'var(--text)',
                }}
                title={opt.desc}
              >
                <span className="text-base leading-none">{opt.emoji}</span>
                <span className="text-[10px] font-semibold mt-0.5 leading-tight">{opt.label}</span>
              </button>
            )
          })}
        </div>
        {sensitivity !== 0 && (
          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
            체감온도를 {Math.abs(sensitivity)}°C {sensitivity < 0 ? '낮게' : '높게'} 적용해 복장을 추천합니다.
          </p>
        )}
      </div>

      {!weather && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
          날씨 데이터를 불러오는 중입니다...
        </p>
      )}

      {result && (
        <>
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
          <OutfitResult result={result} />
        </>
      )}
    </div>
  )
}

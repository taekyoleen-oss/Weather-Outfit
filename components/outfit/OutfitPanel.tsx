'use client'

import { useState, useMemo } from 'react'
import { ActivitySelector } from './ActivitySelector'
import { GenderToggle } from './GenderToggle'
import { OutfitResult } from './OutfitResult'
import { recommendOutfit } from '@/lib/outfit/recommender'
import type { ActivityType, GenderType } from '@/types/outfit'
import type { CurrentWeather, DustData } from '@/types/weather'
import type { TerrainType } from '@/types/location'
import { kstTodayYmd } from '@/lib/utils/timeOfDay'

function calendarMonthKstFromWeather(w: CurrentWeather | null): number | undefined {
  if (!w) return undefined
  const ymd = w.basisDateKst ?? kstTodayYmd()
  if (ymd.length < 6) return undefined
  const m = parseInt(ymd.slice(4, 6), 10)
  return m >= 1 && m <= 12 ? m : undefined
}

interface Props {
  weather: CurrentWeather | null
  dust?: DustData | null
  terrain: TerrainType
  hour: number
}

type SensitivityLevel = -2 | 0 | 2

const SENSITIVITY_OPTIONS: { value: SensitivityLevel; label: string; emoji: string; desc: string }[] = [
  { value: -2, label: '더위에 강함', emoji: '🥶', desc: '더위를 덜 타는 편이에요' },
  { value: 0,  label: '보통',       emoji: '😊', desc: '평균 체감' },
  { value: 2,  label: '추위에 강함', emoji: '🥵', desc: '추위를 덜 타는 편이에요' },
]

const SENSITIVITY_LABEL_MAP: Record<SensitivityLevel, string> = {
  [-2]: '🥶 더위에 강함',
  [0]: '😊 보통',
  [2]: '🥵 추위에 강함',
}

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
    // 민감도 보정:
    // - 더위에 강함(-2) => 체감 온도를 낮춰(더 춥게) 따뜻한 복장 추천
    // - 추위에 강함(+2) => 체감 온도를 높여(더 덥게) 시원한 복장 추천
    const adjustedFeelsLike = weather.feelsLike + sensitivity
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

      <div className="flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <GenderToggle value={gender} onChange={handleGender} />
        </div>
        <div className="w-[130px] sm:w-[150px] space-y-1.5 flex-shrink-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>체감 민감도</p>
          <select
            value={String(sensitivity)}
            onChange={(e) => handleSensitivity(Number(e.target.value) as SensitivityLevel)}
            className="w-full text-xs sm:text-sm rounded-xl px-2.5 py-2 outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            aria-label="체감 민감도 선택"
          >
            {SENSITIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={String(opt.value)}>
                {SENSITIVITY_LABEL_MAP[opt.value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {sensitivity !== 0 && (
        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
          체감온도를 {Math.abs(sensitivity)}°C {sensitivity < 0 ? '낮게' : '높게'} 적용해 복장을 추천합니다.
        </p>
      )}

      {!weather && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
          날씨 데이터를 불러오는 중입니다...
        </p>
      )}

      {result && (
        <>
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
          <OutfitResult
            result={result}
            gender={gender}
            calendarMonth={calendarMonthKstFromWeather(weather)}
            showSunshine={
              !!weather && weather.ptyCode === '0' && weather.skyCode === '1'
            }
            weatherSky={
              weather
                ? { skyCode: weather.skyCode, ptyCode: weather.ptyCode }
                : undefined
            }
          />
        </>
      )}
    </div>
  )
}

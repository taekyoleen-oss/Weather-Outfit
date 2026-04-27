'use client'

import { useState, useMemo } from 'react'
import { ActivitySelector } from './ActivitySelector'
import { GenderToggle } from './GenderToggle'
import { TimeQuickPicker } from './TimeQuickPicker'
import { OutfitResult } from './OutfitResult'
import { recommendOutfit } from '@/lib/outfit/recommender'
import type { ActivityType, GenderType } from '@/types/outfit'
import type { CurrentWeather, DustData } from '@/types/weather'
import type { TerrainType } from '@/types/location'

interface Props {
  weather: CurrentWeather | null
  dust?: DustData | null
  terrain: TerrainType
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

export function OutfitPanel({ weather, dust, terrain }: Props) {
  const [activity, setActivity] = useState<ActivityType>(() => loadPref('wf:activity', 'urban_walk'))
  const [gender, setGender] = useState<GenderType>(() => loadPref('wf:gender', 'male'))
  const [hour, setHour] = useState(() => new Date().getHours())
  const [duration, setDuration] = useState<number>(() => loadPref('wf:duration', 2))

  function handleActivity(a: ActivityType) { setActivity(a); savePref('wf:activity', a) }
  function handleGender(g: GenderType) { setGender(g); savePref('wf:gender', g) }
  function handleDuration(d: number) { setDuration(d); savePref('wf:duration', d) }

  const result = useMemo(() => {
    if (!weather) return null
    return recommendOutfit({
      temperature: weather.temperature,
      feelsLike: weather.feelsLike,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      uvIndex: weather.uvIndex,
      ptyCode: weather.ptyCode,
      dustGrade: dust?.pm10Grade ?? '2',
      activity,
      gender,
      hour,
      duration,
      terrain,
    })
  }, [weather, dust, activity, gender, hour, duration, terrain])

  return (
    <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-5">
      <h2 className="text-base font-bold" style={{ color: 'var(--primary)' }}>
        복장 추천 설정
      </h2>

      <ActivitySelector value={activity} onChange={handleActivity} />

      <div className="border-t" style={{ borderColor: 'var(--border)' }} />

      <TimeQuickPicker
        hour={hour}
        duration={duration}
        onHourChange={setHour}
        onDurationChange={handleDuration}
      />

      <div className="border-t" style={{ borderColor: 'var(--border)' }} />

      <GenderToggle value={gender} onChange={handleGender} />

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

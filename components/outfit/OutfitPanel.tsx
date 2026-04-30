'use client'

import { useState, useMemo, useEffect } from 'react'
import { ActivitySelector } from './ActivitySelector'
import { GenderToggle } from './GenderToggle'
import { OutfitResult } from './OutfitResult'
import { OutfitLlmSuggest } from './OutfitLlmSuggest'
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
  /** 선택한 시간대의 시작 시각(새벽 0, 오전 6, …) */
  outfitPeriodStartHour: number
  /** 오늘·현재 구간(지금)이면 시작 시각 하한을 현재 시+1(KST)로 둠 */
  outfitIsNowPeriod: boolean
  /** KST 현재 시(0–23) */
  outfitCurrentKstHour: number
  /** 시간대·날짜 변경 시 복장 시작/종료 시각을 다시 맞출 때 사용하는 키 */
  outfitScheduleSyncKey: string
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

const ACTIVITY_DEFAULT_DURATION_HOURS: Record<ActivityType, number> = {
  urban_walk: 2,
  running: 2,
  river: 2,
  beach: 2,
  cycling: 4,
  tennis: 4,
  ski: 4,
  golf: 7,
  hiking: 7,
  picnic: 2,
}

function addHoursWrap24(baseHour: number, deltaHour: number): number {
  return (baseHour + deltaHour) % 24
}

function durationFromStartEnd(startHour: number, endHour: number): number {
  const raw = (endHour - startHour + 24) % 24
  return raw === 0 ? 1 : raw
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

function activityStartFloor(periodStart: number, isNow: boolean, kstHour: number): number {
  return isNow ? (kstHour + 1) % 24 : periodStart
}

export function OutfitPanel({
  weather,
  dust,
  terrain,
  outfitPeriodStartHour,
  outfitIsNowPeriod,
  outfitCurrentKstHour,
  outfitScheduleSyncKey,
}: Props) {
  const [activity, setActivity] = useState<ActivityType>('urban_walk')
  const [gender, setGender] = useState<GenderType>(() => loadPref('wf:gender', 'male'))
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(() => loadPref('wf:sensitivity', 0) as SensitivityLevel)
  const [startHour, setStartHour] = useState<number>(() =>
    activityStartFloor(outfitPeriodStartHour, outfitIsNowPeriod, outfitCurrentKstHour)
  )
  const [endHour, setEndHour] = useState<number>(() =>
    addHoursWrap24(
      activityStartFloor(outfitPeriodStartHour, outfitIsNowPeriod, outfitCurrentKstHour),
      ACTIVITY_DEFAULT_DURATION_HOURS.urban_walk
    )
  )

  function handleActivity(a: ActivityType) {
    setActivity(a)
    savePref('wf:activity', a)
    setEndHour(addHoursWrap24(startHour, ACTIVITY_DEFAULT_DURATION_HOURS[a]))
  }
  function handleGender(g: GenderType) { setGender(g); savePref('wf:gender', g) }
  function handleSensitivity(s: SensitivityLevel) { setSensitivity(s); savePref('wf:sensitivity', s) }
  function handleStartHour(next: number) {
    setStartHour(next)
    const defaultDuration = ACTIVITY_DEFAULT_DURATION_HOURS[activity]
    setEndHour(addHoursWrap24(next, defaultDuration))
  }
  function handleEndHour(next: number) {
    setEndHour(next)
  }
  const selectedDuration = durationFromStartEnd(startHour, endHour)

  const startHourMin = activityStartFloor(outfitPeriodStartHour, outfitIsNowPeriod, outfitCurrentKstHour)

  useEffect(() => {
    const f = activityStartFloor(outfitPeriodStartHour, outfitIsNowPeriod, outfitCurrentKstHour)
    setStartHour(f)
    setEndHour(addHoursWrap24(f, ACTIVITY_DEFAULT_DURATION_HOURS[activity]))
    // 시각이 한 시간 넘어갈 때마다 초기화하지 않음(지금 구간에서만 별도로 하한 상향)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- outfitCurrentKstHour는 의도적으로 제외
  }, [outfitScheduleSyncKey, outfitPeriodStartHour, outfitIsNowPeriod, activity])

  useEffect(() => {
    if (!outfitIsNowPeriod) return
    const f = (outfitCurrentKstHour + 1) % 24
    setStartHour((s) => (s < f ? f : s))
  }, [outfitCurrentKstHour, outfitIsNowPeriod])

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
      hour: startHour,
      duration: selectedDuration,
      terrain,
    })
  }, [weather, dust, activity, gender, terrain, sensitivity, startHour, selectedDuration])

  return (
    <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-5 min-w-0 max-w-full overflow-x-hidden">
      <h2 className="text-base font-bold" style={{ color: 'var(--primary)' }}>
        복장 추천 설정
      </h2>

      <ActivitySelector
        value={activity}
        onChange={handleActivity}
        startHour={startHour}
        startHourMin={startHourMin}
        endHour={endHour}
        onStartHourChange={handleStartHour}
        onEndHourChange={handleEndHour}
      />

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

      {result && weather && (
        <>
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
          <p className="text-[11px] font-semibold pt-1" style={{ color: 'var(--muted)' }}>
            가이드라인·룰 기반 추천
          </p>
          <OutfitResult
            result={result}
            schedule={{ startHour, endHour, durationHour: selectedDuration }}
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
          <OutfitLlmSuggest
            weather={weather}
            dust={dust}
            activity={activity}
            gender={gender}
            terrain={terrain}
            hour={startHour}
            durationHours={selectedDuration}
            result={result}
            feelsLikeSensitivity={sensitivity}
          />
        </>
      )}
    </div>
  )
}

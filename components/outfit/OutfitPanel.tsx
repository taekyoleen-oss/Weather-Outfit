'use client'

import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react'
import { ActivitySelector } from './ActivitySelector'
import { GenderToggle } from './GenderToggle'
import { OutfitResult } from './OutfitResult'
import { OutfitLlmSuggest } from './OutfitLlmSuggest'
import { recommendOutfit } from '@/lib/outfit/recommender'
import type { ActivityType, GenderType } from '@/types/outfit'
import type { CurrentWeather, DustData, HourlyForecast, WeatherAlert } from '@/types/weather'
import type { TerrainType } from '@/types/location'
import { addCalendarDaysFromKstYmd, kstTodayYmd } from '@/lib/utils/timeOfDay'
import { OutfitDayChecklist } from './OutfitDayChecklist'
import { weatherLabel } from '@/lib/utils/formatWeather'
import { buildHourlySlotYmds } from '@/lib/utils/resolveHourlyForPeriod'

function calendarMonthKstFromWeather(w: CurrentWeather | null): number | undefined {
  if (!w) return undefined
  const ymd = w.basisDateKst ?? kstTodayYmd()
  if (ymd.length < 6) return undefined
  const m = parseInt(ymd.slice(4, 6), 10)
  return m >= 1 && m <= 12 ? m : undefined
}

interface Props {
  weather: CurrentWeather | null
  hourly?: HourlyForecast[]
  dust?: DustData | null
  alerts?: WeatherAlert[]
  terrain: TerrainType
  /** 선택한 시간대의 시작 시각(새벽 0, 오전 6, …) */
  outfitPeriodStartHour: number
  /** 오늘·현재 구간(지금)이면 시작 시각 하한을 현재 시+1(KST)로 둠 */
  outfitIsNowPeriod: boolean
  /** KST 현재 시(0–23) */
  outfitCurrentKstHour: number
  /** 시간대·날짜 변경 시 복장 시작/종료 시각을 다시 맞출 때 사용하는 키 */
  outfitScheduleSyncKey: string
  scheduleYmd: string
  scheduleYmdMin: string
  scheduleYmdMax: string
  onScheduleYmdChange: (ymd: string) => void
  /** 시작 시각 선택 하한(0–23) — 페이지에서 KST·기준일 반영 */
  activityStartHourMin: number
  /** 상단 날씨 카드·스트립과 동기화 */
  onActivityHoursChange?: (startHour: number, endHour: number) => void
  /** 모바일 탭: 긴 블록은 바텀시트로 분리 */
  variant?: 'default' | 'mobileSheet'
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

function MobileBottomSheet({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="outfit-sheet-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md max-h-[88dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <p id="outfit-sheet-title" className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-sm leading-none"
            style={{ color: 'var(--muted)', background: 'var(--surface)' }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  )
}

export function OutfitPanel({
  weather,
  hourly = [],
  dust,
  alerts = [],
  terrain,
  outfitPeriodStartHour,
  outfitIsNowPeriod,
  outfitCurrentKstHour,
  outfitScheduleSyncKey,
  scheduleYmd,
  scheduleYmdMin,
  scheduleYmdMax,
  onScheduleYmdChange,
  activityStartHourMin,
  onActivityHoursChange,
  variant = 'default',
}: Props) {
  const isMobileSheet = variant === 'mobileSheet'
  const [sheetSettings, setSheetSettings] = useState(false)
  const [sheetAi, setSheetAi] = useState(false)
  const [sheetChecklist, setSheetChecklist] = useState(false)

  const [activity, setActivity] = useState<ActivityType>('urban_walk')
  /** SSR·첫 클라이언트 페인트는 서버와 동일한 기본값 → hydration 일치 후 localStorage 복원 */
  const [gender, setGender] = useState<GenderType>('male')
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(0)

  useEffect(() => {
    const g = loadPref<GenderType>('wf:gender', 'male')
    if (g === 'female' || g === 'male') setGender(g)
    const raw = loadPref<number>('wf:sensitivity', 0)
    if (raw === -2 || raw === 0 || raw === 2) setSensitivity(raw as SensitivityLevel)
  }, [])
  const [startHour, setStartHour] = useState<number>(() =>
    activityStartFloor(outfitPeriodStartHour, outfitIsNowPeriod, outfitCurrentKstHour)
  )
  const [endHour, setEndHour] = useState<number>(() =>
    addHoursWrap24(
      activityStartFloor(outfitPeriodStartHour, outfitIsNowPeriod, outfitCurrentKstHour),
      ACTIVITY_DEFAULT_DURATION_HOURS.urban_walk
    )
  )

  const activityRef = useRef(activity)
  activityRef.current = activity

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

  const startHourMin = activityStartHourMin

  useEffect(() => {
    onActivityHoursChange?.(startHour, endHour)
  }, [startHour, endHour, onActivityHoursChange])

  useEffect(() => {
    const f = activityStartFloor(outfitPeriodStartHour, outfitIsNowPeriod, outfitCurrentKstHour)
    setStartHour(f)
    setEndHour(addHoursWrap24(f, ACTIVITY_DEFAULT_DURATION_HOURS[activityRef.current]))
    // outfitCurrentKstHour, activityRef: intentionally excluded — kst hour has its own effect; activity change is handled by handleActivity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitScheduleSyncKey, outfitPeriodStartHour, outfitIsNowPeriod])

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

  const periodWeather = useMemo(() => {
    if (!hourly.length) return null
    const slotYmds = buildHourlySlotYmds(hourly, kstTodayYmd())
    const nextYmd = addCalendarDaysFromKstYmd(scheduleYmd, 1)
    const inRange = hourly.filter((h, i) => {
      const slotYmd = slotYmds[i]
      if (!slotYmd) return false
      const hour = parseInt(h.time.slice(0, 2), 10)
      if (Number.isNaN(hour)) return false
      if (startHour <= endHour) {
        return slotYmd === scheduleYmd && hour >= startHour && hour <= endHour
      }
      return (slotYmd === scheduleYmd && hour >= startHour) || (slotYmd === nextYmd && hour <= endHour)
    })
    if (!inRange.length) return null

    const minTemp = Math.min(...inRange.map((h) => h.temperature))
    const maxTemp = Math.max(...inRange.map((h) => h.temperature))
    const labelCounts = new Map<string, number>()
    for (const h of inRange) {
      const label = weatherLabel(h.skyCode, h.ptyCode)
      labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1)
    }
    const label =
      [...labelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      weatherLabel(inRange[0]!.skyCode, inRange[0]!.ptyCode)
    return { label, minTemp, maxTemp }
  }, [hourly, scheduleYmd, startHour, endHour])

  const genderSensitivityBlock = (
    <>
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
    </>
  )

  return (
    <div
      className={`glass-card min-w-0 max-w-full overflow-x-hidden ${
        isMobileSheet ? 'p-3 space-y-3' : 'p-4 sm:p-6 space-y-4 sm:space-y-5'
      }`}
    >
      <h2 className={`font-bold ${isMobileSheet ? 'text-sm' : 'text-base'}`} style={{ color: 'var(--primary)' }}>
        {isMobileSheet ? '👔 외출 복장' : '복장 추천 설정'}
      </h2>

      <ActivitySelector
        value={activity}
        onChange={handleActivity}
        scheduleYmd={scheduleYmd}
        scheduleYmdMin={scheduleYmdMin}
        scheduleYmdMax={scheduleYmdMax}
        onScheduleYmdChange={onScheduleYmdChange}
        startHour={startHour}
        startHourMin={startHourMin}
        endHour={endHour}
        onStartHourChange={handleStartHour}
        onEndHourChange={handleEndHour}
      />

      {isMobileSheet ? (
        <button
          type="button"
          onClick={() => setSheetSettings(true)}
          className="w-full text-left text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors active:scale-[0.99]"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          <span className="text-[10px] block mb-0.5" style={{ color: 'var(--muted)' }}>세부 옵션</span>
          성별 · 체감 민감도 ({SENSITIVITY_LABEL_MAP[sensitivity]})
        </button>
      ) : (
        <>
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
          {genderSensitivityBlock}
        </>
      )}

      {!weather && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
          날씨 데이터를 불러오는 중입니다...
        </p>
      )}

      {result && weather && (
        <>
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
          <p className={`font-semibold pt-1 ${isMobileSheet ? 'text-[10px]' : 'text-[11px]'}`} style={{ color: 'var(--muted)' }}>
            가이드라인·룰 기반 추천
          </p>
          <OutfitResult
            result={result}
            schedule={{ startHour, endHour, durationHour: selectedDuration }}
            periodWeather={periodWeather}
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
          {isMobileSheet ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSheetAi(true)}
                className="text-xs font-semibold py-3 px-2 rounded-xl transition-colors active:scale-[0.98]"
                style={{
                  background: 'rgba(91,141,238,0.12)',
                  border: '1px solid var(--border)',
                  color: 'var(--humidity)',
                }}
              >
                ✨ AI 코멘트
              </button>
              <button
                type="button"
                onClick={() => setSheetChecklist(true)}
                className="text-xs font-semibold py-3 px-2 rounded-xl transition-colors active:scale-[0.98]"
                style={{
                  background: 'rgba(34,197,94,0.10)',
                  border: '1px solid var(--border)',
                  color: '#15803d',
                }}
              >
                ✅ 오늘 체크
              </button>
            </div>
          ) : (
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
          )}
        </>
      )}

      {weather && !isMobileSheet && (
        <>
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
          <OutfitDayChecklist
            weather={weather}
            dust={dust ?? null}
            alerts={alerts}
            durationHours={selectedDuration}
            sensitivity={sensitivity}
          />
        </>
      )}

      {isMobileSheet && sheetSettings && (
        <MobileBottomSheet title="성별 · 체감 민감도" onClose={() => setSheetSettings(false)}>
          {genderSensitivityBlock}
        </MobileBottomSheet>
      )}
      {isMobileSheet && sheetAi && result && weather && (
        <MobileBottomSheet title="AI 복장 코멘트" onClose={() => setSheetAi(false)}>
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
        </MobileBottomSheet>
      )}
      {isMobileSheet && sheetChecklist && weather && (
        <MobileBottomSheet title="오늘 외출 체크리스트" onClose={() => setSheetChecklist(false)}>
          <OutfitDayChecklist
            weather={weather}
            dust={dust ?? null}
            alerts={alerts}
            durationHours={selectedDuration}
            sensitivity={sensitivity}
          />
        </MobileBottomSheet>
      )}
    </div>
  )
}

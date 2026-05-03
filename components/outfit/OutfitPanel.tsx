'use client'

import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react'
import { ActivitySelector } from './ActivitySelector'
import { GenderToggle } from './GenderToggle'
import { OutfitResult } from './OutfitResult'
import { OutfitLlmSuggest } from './OutfitLlmSuggest'
import { recommendOutfit } from '@/lib/outfit/recommender'
import type { ActivityType, GenderType } from '@/types/outfit'
import type {
  CurrentWeather,
  DailyForecast,
  DustData,
  HourlyForecast,
  WeatherAlert,
} from '@/types/weather'
import type { TerrainType } from '@/types/location'
import { addCalendarDaysFromKstYmd, diffCalendarDaysYmd, kstTodayYmd } from '@/lib/utils/timeOfDay'
import { OutfitDayChecklist } from './OutfitDayChecklist'
import { weatherEmojiFromLabel, weatherLabel } from '@/lib/utils/formatWeather'
import { buildHourlySlotYmds } from '@/lib/utils/resolveHourlyForPeriod'
import type { VisitSchedule } from '@/lib/utils/visitSchedule'
import { getPeriodIndex, PERIOD_CHIP_LABELS_KO, TIME_PERIODS } from '@/lib/utils/timePeriods'

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
  /** 일별 예보 — 시간대별 슬롯이 없을 때 최고·최저·날씨 표시용 */
  daily?: DailyForecast[]
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
  /** 모바일: 관심지역 탭 일정과 동기화·±4h 조정 */
  mobileInterestSchedule?: VisitSchedule | null
  onMobileInterestScheduleChange?: (s: VisitSchedule) => void
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

function visitSchedulePeriodLabel(s: VisitSchedule): string {
  const i = TIME_PERIODS.findIndex((p) => p.start === s.startHour && p.end === s.endHour)
  return i >= 0 ? PERIOD_CHIP_LABELS_KO[i] : '시간대'
}

function periodChipNameFromHours(startHour: number, endHour: number): string {
  const i = TIME_PERIODS.findIndex((p) => p.start === startHour && p.end === endHour)
  return i >= 0 ? PERIOD_CHIP_LABELS_KO[i] : '선택 구간'
}

/** 모바일 시간대 칩 맨 위 라벨 — 오늘은 구간명만, 미래는 「내일 새벽」「모레 아침」 등 */
function mobileChipPeriodLineLabel(visitYmd: string, periodIdx: number): string {
  const todayYmd = kstTodayYmd()
  const base = PERIOD_CHIP_LABELS_KO[periodIdx]
  const diff = diffCalendarDaysYmd(todayYmd, visitYmd)
  if (diff <= 0) return base
  if (diff === 1) return `내일 ${base}`
  if (diff === 2) return `모레 ${base}`
  return `${visitYmd.slice(4, 6)}/${visitYmd.slice(6, 8)} ${base}`
}

/** 일별 최저~최고만 있을 때 시간대별 대표 기온 비중(새벽·아침·점심·저녁) */
const DAILY_EST_TEMP_WEIGHTS = [0.12, 0.38, 0.88, 0.45] as const

function buildOutfitPeriodChipPreviews(
  scheduleYmd: string,
  hourly: HourlyForecast[],
  daily: DailyForecast[],
): { source: 'hourly' | 'daily_est'; conditionLabel: string; tempLine: string }[] {
  const todayYmd = kstTodayYmd()
  const slotYmds = buildHourlySlotYmds(hourly, todayYmd)
  const nextYmd = addCalendarDaysFromKstYmd(scheduleYmd, 1)
  const dayRow = daily.find((d) => d.date === scheduleYmd)

  return TIME_PERIODS.map((p, idx) => {
    const inRange = hourly.filter((h, i) => {
      const slotYmd = slotYmds[i]
      if (!slotYmd) return false
      const hourNum = parseInt(h.time.slice(0, 2), 10)
      if (Number.isNaN(hourNum)) return false
      if (p.start <= p.end) {
        return slotYmd === scheduleYmd && hourNum >= p.start && hourNum <= p.end
      }
      return (
        (slotYmd === scheduleYmd && hourNum >= p.start) ||
        (slotYmd === nextYmd && hourNum <= p.end)
      )
    })

    if (inRange.length > 0) {
      const minT = Math.min(...inRange.map((x) => x.temperature))
      const maxT = Math.max(...inRange.map((x) => x.temperature))
      const labelCounts = new Map<string, number>()
      for (const h of inRange) {
        const lab = weatherLabel(h.skyCode, h.ptyCode)
        labelCounts.set(lab, (labelCounts.get(lab) ?? 0) + 1)
      }
      const conditionLabel =
        [...labelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
        weatherLabel(inRange[0]!.skyCode, inRange[0]!.ptyCode)
      const tempLine =
        Math.round(minT) === Math.round(maxT)
          ? `${Math.round(minT)}°`
          : `${Math.round(minT)}°/${Math.round(maxT)}°`
      return { source: 'hourly', conditionLabel, tempLine }
    }

    if (dayRow) {
      const span = dayRow.maxTemp - dayRow.minTemp
      const rep = Math.round(dayRow.minTemp + span * DAILY_EST_TEMP_WEIGHTS[idx])
      return {
        source: 'daily_est',
        conditionLabel: weatherLabel(dayRow.skyCode, dayRow.ptyCode),
        tempLine: `~${rep}°`,
      }
    }

    return { source: 'daily_est', conditionLabel: '—', tempLine: '—' }
  })
}

function ymdToDateInput(ymd: string): string {
  if (ymd.length !== 8) return ''
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

function isoToYmd(iso: string): string {
  return iso.replace(/-/g, '')
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
  daily = [],
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
  mobileInterestSchedule,
  onMobileInterestScheduleChange,
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

  useEffect(() => {
    if (!isMobileSheet || !mobileInterestSchedule) return
    setStartHour(mobileInterestSchedule.startHour)
    setEndHour(mobileInterestSchedule.endHour)
  }, [
    isMobileSheet,
    mobileInterestSchedule?.startHour,
    mobileInterestSchedule?.endHour,
    mobileInterestSchedule?.visitDateYmd,
  ])

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
    const todayYmd = kstTodayYmd()
    const slotYmds = buildHourlySlotYmds(hourly, todayYmd)
    const nextYmd = addCalendarDaysFromKstYmd(scheduleYmd, 1)
    const inRange = hourly.filter((h, i) => {
      const slotYmd = slotYmds[i]
      if (!slotYmd) return false
      const hourNum = parseInt(h.time.slice(0, 2), 10)
      if (Number.isNaN(hourNum)) return false
      if (startHour <= endHour) {
        return slotYmd === scheduleYmd && hourNum >= startHour && hourNum <= endHour
      }
      return (
        (slotYmd === scheduleYmd && hourNum >= startHour) ||
        (slotYmd === nextYmd && hourNum <= endHour)
      )
    })

    if (inRange.length > 0) {
      const minTemp = Math.min(...inRange.map((h) => h.temperature))
      const maxTemp = Math.max(...inRange.map((h) => h.temperature))
      const labelCounts = new Map<string, number>()
      for (const h of inRange) {
        const label = weatherLabel(h.skyCode, h.ptyCode)
        labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1)
      }
      const conditionLabel =
        [...labelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
        weatherLabel(inRange[0]!.skyCode, inRange[0]!.ptyCode)
      return {
        source: 'period_hourly' as const,
        conditionLabel,
        minTemp,
        maxTemp,
        periodName: periodChipNameFromHours(startHour, endHour),
      }
    }

    const dayRow = daily.find((d) => d.date === scheduleYmd)
    if (dayRow) {
      return {
        source: 'day_daily' as const,
        conditionLabel: weatherLabel(dayRow.skyCode, dayRow.ptyCode),
        minTemp: dayRow.minTemp,
        maxTemp: dayRow.maxTemp,
      }
    }
    return null
  }, [hourly, daily, scheduleYmd, startHour, endHour])

  /** 모바일 관심 일정 날짜는 입력값과 즉시 맞춤(페이지 scheduleYmd보다 앞설 수 있음) */
  const periodChipPreviewYmd =
    isMobileSheet && mobileInterestSchedule ? mobileInterestSchedule.visitDateYmd : scheduleYmd

  const periodChipPreviews = useMemo(
    () => buildOutfitPeriodChipPreviews(periodChipPreviewYmd, hourly, daily),
    [periodChipPreviewYmd, hourly, daily],
  )

  /** 오늘: 현재 시간대 → 오른쪽으로 새벽·아침·점심·저녁 순(순환). 그 외 날짜: 새벽부터 */
  const mobilePeriodChipIndices = useMemo(() => {
    if (!isMobileSheet || !mobileInterestSchedule) return [0, 1, 2, 3] as number[]
    const todayYmd = kstTodayYmd()
    const visitYmd = mobileInterestSchedule.visitDateYmd
    if (visitYmd !== todayYmd) return [0, 1, 2, 3]
    const cur = getPeriodIndex(outfitCurrentKstHour)
    return [0, 1, 2, 3].map((k) => (cur + k) % 4)
  }, [isMobileSheet, mobileInterestSchedule?.visitDateYmd, outfitCurrentKstHour])

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
      {!isMobileSheet && (
        <div className="flex items-start justify-between gap-2 flex-col">
          <h2 className="font-bold min-w-0 flex-1 text-base" style={{ color: 'var(--primary)' }}>
            복장 추천 설정
          </h2>
        </div>
      )}

      {isMobileSheet && mobileInterestSchedule && onMobileInterestScheduleChange && (
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>날짜</span>
            <input
              type="date"
              className="w-full text-xs rounded-lg px-2 py-2 outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              min={ymdToDateInput(scheduleYmdMin)}
              max={ymdToDateInput(scheduleYmdMax)}
              value={ymdToDateInput(mobileInterestSchedule.visitDateYmd)}
              onChange={(e) => {
                const v = e.target.value
                if (!v) return
                onMobileInterestScheduleChange({
                  ...mobileInterestSchedule,
                  visitDateYmd: isoToYmd(v),
                })
              }}
            />
          </label>
          {diffCalendarDaysYmd(kstTodayYmd(), mobileInterestSchedule.visitDateYmd) === 1 ? (
            <p
              className="text-center text-xs font-bold py-1.5 px-2 rounded-lg"
              style={{ background: 'var(--primary-tint-10)', color: 'var(--primary)' }}
            >
              내일
            </p>
          ) : null}
          <div className="grid grid-cols-4 gap-1">
            {mobilePeriodChipIndices.map((periodIdx) => {
              const p = TIME_PERIODS[periodIdx]!
              const selected =
                mobileInterestSchedule.startHour === p.start &&
                mobileInterestSchedule.endHour === p.end
              const preview = periodChipPreviews[periodIdx]!
              const wxEmoji =
                preview.conditionLabel !== '—'
                  ? weatherEmojiFromLabel(preview.conditionLabel)
                  : p.emoji
              return (
                <button
                  key={p.id}
                  type="button"
                  title={`${preview.conditionLabel} · ${preview.tempLine}`}
                  className="flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-lg text-center transition-all active:scale-95 min-w-0 min-h-[76px]"
                  style={{
                    background: selected ? 'var(--primary-tint-12)' : 'var(--surface)',
                    border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                  onClick={() =>
                    onMobileInterestScheduleChange({
                      ...mobileInterestSchedule,
                      startHour: p.start,
                      endHour: p.end,
                    })
                  }
                >
                  <span
                    className="font-semibold leading-tight text-[9px] sm:text-[10px] break-keep line-clamp-2 w-full px-0.5"
                    style={{ color: selected ? 'var(--primary)' : 'var(--text)' }}
                  >
                    {mobileChipPeriodLineLabel(mobileInterestSchedule.visitDateYmd, periodIdx)}
                  </span>
                  <span className="text-[15px] sm:text-base leading-none" aria-hidden>
                    {wxEmoji}
                  </span>
                  <span
                    className="font-medium leading-tight text-[8px] sm:text-[9px] break-keep line-clamp-1 w-full px-0.5"
                    style={{ color: selected ? 'var(--primary)' : 'var(--muted)' }}
                  >
                    {preview.conditionLabel !== '—' ? preview.conditionLabel : '—'}
                  </span>
                  <span
                    className="text-[10px] sm:text-[11px] font-bold tabular-nums leading-none"
                    style={{ color: selected ? 'var(--primary)' : 'var(--text)' }}
                  >
                    {preview.tempLine}
                  </span>
                  {preview.source === 'daily_est' && preview.conditionLabel !== '—' && (
                    <span className="text-[7px] leading-none" style={{ color: 'var(--muted)' }}>
                      일별추정
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-center leading-snug" style={{ color: 'var(--muted)' }}>
              기준 {scheduleYmd.slice(0, 4)}.{scheduleYmd.slice(4, 6)}.{scheduleYmd.slice(6, 8)} ·{' '}
              {visitSchedulePeriodLabel(mobileInterestSchedule)}
            </p>
            {periodWeather ? (
              <p
                className="text-[10px] text-center leading-snug font-semibold"
                style={{ color: 'var(--text)' }}
              >
                {periodWeather.source === 'period_hourly'
                  ? `${periodWeather.periodName} 구간 · `
                  : '해당일 · '}
                {periodWeather.conditionLabel} · 최고 {Math.round(periodWeather.maxTemp)}° / 최저{' '}
                {Math.round(periodWeather.minTemp)}°
              </p>
            ) : hourly.length > 0 || daily.length > 0 ? (
              <p className="text-[10px] text-center" style={{ color: 'var(--muted)' }}>
                선택 날짜·구간의 예보를 불러오지 못했습니다.
              </p>
            ) : null}
          </div>
        </div>
      )}

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
        variant={isMobileSheet ? 'mobileSimple' : 'default'}
        hideScheduleFields={isMobileSheet}
      />

      {isMobileSheet ? null : (
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
            resultTitle={isMobileSheet ? '복장 추천' : undefined}
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
            headerEnd={
              isMobileSheet ? (
                <button
                  type="button"
                  onClick={() => setSheetSettings(true)}
                  className="max-w-[55vw] sm:max-w-[55%] text-right text-[10px] font-semibold py-1.5 px-2 rounded-lg transition-colors active:scale-[0.99]"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>
                    세부 옵션
                  </span>
                  <span className="block truncate leading-snug">
                    성별 · 체감 ({SENSITIVITY_LABEL_MAP[sensitivity]})
                  </span>
                </button>
              ) : undefined
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

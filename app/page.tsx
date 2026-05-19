'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { LocationSearchBar } from '@/components/weather/LocationSearchBar'
import { GpsButton } from '@/components/weather/GpsButton'
import { RecentChips, saveRecentLocation } from '@/components/weather/RecentChips'
import { WeatherCard } from '@/components/weather/WeatherCard'
import { HourlyWeatherStrip } from '@/components/weather/HourlyWeatherStrip'
import { ChartErrorBoundary } from '@/components/ui/ChartErrorBoundary'
import dynamic from 'next/dynamic'
const TempGraph48h = dynamic(
  () => import('@/components/weather/TempGraph48h').then((m) => m.TempGraph48h),
  { ssr: false, loading: () => (
    <div className="glass-card p-3 sm:p-4">
      <p className="text-base font-semibold mb-2" style={{ color: 'var(--muted)' }}>48시간 기온</p>
      <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  )}
)
const WeeklyForecastInline = dynamic(
  () => import('@/components/weather/WeeklyForecastInline').then((m) => m.WeeklyForecastInline),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-lg" style={{ background: 'var(--colors-surface-soft)' }} /> }
)
import { HighlightsGrid } from '@/components/weather/HighlightsGrid'
import { HighlightCard } from '@/components/weather/HighlightCard'
import { TimePeriodPicker } from '@/components/weather/TimePeriodPicker'
import { OutfitPanel } from '@/components/outfit/OutfitPanel'
import { WeeklyForecastHero } from '@/components/weather/WeeklyForecastHero'
import { WeeklyForecastListMobile } from '@/components/weather/WeeklyForecastListMobile'
import { SpotPanel } from '@/components/spot/SpotPanel'
import { UltraSrtFcstCard } from '@/components/weather/UltraSrtFcstCard'
import { PrecipAlertModal } from '@/components/weather/PrecipAlertModal'
import type { PrecipGroup } from '@/components/weather/PrecipAlertModal'
import { useAutoLocation } from '@/lib/hooks/useAutoLocation'
import { useWeather } from '@/lib/hooks/useWeather'
import { useWeeklyForecast } from '@/lib/hooks/useWeeklyForecast'
import { useFavoriteLocations } from '@/lib/hooks/useFavoriteLocations'
import { useCompanionProfile, COMPANION_PROFILES } from '@/lib/hooks/useCompanionProfile'
import { FavoriteChips } from '@/components/weather/FavoriteChips'
import { OutfitChecklist } from '@/components/outfit/OutfitChecklist'
import {
  getTimeOfDay,
  kstTodayYmd,
  diffCalendarDaysYmd,
  addCalendarDaysFromKstYmd,
  currentHourKst,
} from '@/lib/utils/timeOfDay'
import { useNowMinute } from '@/lib/hooks/useNowMinute'
import { feelsLike, weatherLabel, weatherEmojiFromLabel, pickIllustKey, illustFile, uvLabel, uvColor, o3GradeLabel, o3GradeColor } from '@/lib/utils/formatWeather'
import { KMA_WEATHER_WARN_PAGE } from '@/lib/weather/kma-alert'
import {
  TIME_PERIODS,
  OUTFIT_PERIODS,
  getPeriodIndex,
  getOutfitPeriodIndex,
  samePeriodHourlySliceFloor,
  orderHourlyStripBeforeNoon,
  type TimePeriod,
} from '@/lib/utils/timePeriods'
import { buildHourlySlotYmds, resolveHourlyForYmdBand } from '@/lib/utils/resolveHourlyForPeriod'
import { mergeWeeklyDailyStartingTomorrow, mergeWeeklyDailyFromToday } from '@/lib/weather/weeklyFromTomorrow'
import type {
  DustData,
  PollenData,
  SunriseSunset,
  WeatherAlert,
  CurrentWeather,
  HourlyForecast,
  MorningSummary,
} from '@/types/weather'
import type { LocationInfo } from '@/types/location'
import type { OpenMeteoDailyCompare } from '@/lib/weather/openMeteoCompare'

// ── 외출옷 시간대·날짜 선택 영구 저장 (localStorage) ──────────────────────────
// 사용자가 선택한 시간대/날짜가 「미래」이면 앱 재실행 후 복원, 「과거」면 무시하고 현재로 리셋.
const OUTFIT_SCHED_STORAGE_KEY = 'wf:outfit:schedule'

interface OutfitScheduleSnapshot {
  periodPreset: { repHour: number; dayOffset: number }
  periodPresetEnd: { repHour: number; dayOffset: number } | null
  scheduleYmd: string
  wxActivityHours: { start: number; end: number } | null
}

function loadOutfitSched(): OutfitScheduleSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(OUTFIT_SCHED_STORAGE_KEY)
    return v ? (JSON.parse(v) as OutfitScheduleSnapshot) : null
  } catch { return null }
}

function saveOutfitSched(s: OutfitScheduleSnapshot): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(OUTFIT_SCHED_STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

/** 선택된 시간대 중 가장 늦은 종료 모먼트(KST)가 현재 시각보다 미래인지 판정. 동일 시각 포함. */
function isOutfitSchedFuture(s: OutfitScheduleSnapshot, nowYmd: string, nowHour: number): boolean {
  const endChip = s.periodPresetEnd ?? s.periodPreset
  const endPeriod = OUTFIT_PERIODS[getOutfitPeriodIndex(endChip.repHour)]
  if (!endPeriod) return false
  const endYmd = addCalendarDaysFromKstYmd(s.scheduleYmd, endChip.dayOffset)
  const dayDiff = diffCalendarDaysYmd(nowYmd, endYmd)
  if (dayDiff < 0) return false
  if (dayDiff > 0) return true
  // 같은 날: wxActivityHours.end가 있으면 그 값, 없으면 칩 구간 종료시
  const endHour = s.wxActivityHours?.end ?? endPeriod.end
  return endHour >= nowHour
}

/**
 * 저장된 snapshot의 scheduleYmd가 「저장 당시의 오늘」을 가리킬 수 있으므로
 * 실제 선택 절대일자를 기준으로 새 scheduleYmd·dayOffset을 재계산.
 * - 원본 scheduleYmd가 미래(today_now보다 큼) → 풀데이 모드로 저장된 것이므로 그대로 유지
 * - 원본 scheduleYmd가 오늘 이하 → 롤링 모드. scheduleYmd=today_now로 정규화하고 offset 재계산
 */
function normalizeRestoredSnap(snap: OutfitScheduleSnapshot, nowYmd: string): OutfitScheduleSnapshot {
  if (diffCalendarDaysYmd(nowYmd, snap.scheduleYmd) > 0) return snap

  const startActualYmd = addCalendarDaysFromKstYmd(snap.scheduleYmd, snap.periodPreset.dayOffset)
  const newStartOffset = Math.max(0, diffCalendarDaysYmd(nowYmd, startActualYmd))
  let newPresetEnd: OutfitScheduleSnapshot['periodPresetEnd'] = null
  if (snap.periodPresetEnd) {
    const endActualYmd = addCalendarDaysFromKstYmd(snap.scheduleYmd, snap.periodPresetEnd.dayOffset)
    newPresetEnd = {
      repHour: snap.periodPresetEnd.repHour,
      dayOffset: Math.max(0, diffCalendarDaysYmd(nowYmd, endActualYmd)),
    }
  }
  return {
    periodPreset: { repHour: snap.periodPreset.repHour, dayOffset: newStartOffset },
    periodPresetEnd: newPresetEnd,
    scheduleYmd: nowYmd,
    wxActivityHours: snap.wxActivityHours,
  }
}

/** 첫 마운트 시 한 번만 호출 — 미래 selection이면 정규화된 snapshot, 아니면 null */
function getInitialRestoredSnap(): OutfitScheduleSnapshot | null {
  const snap = loadOutfitSched()
  if (!snap) return null
  const nowYmd = kstTodayYmd()
  const nowHour = currentHourKst()
  if (!isOutfitSchedFuture(snap, nowYmd, nowHour)) return null
  return normalizeRestoredSnap(snap, nowYmd)
}

// ── Spot data shape (subset used by page) ────────────────────────────────────
interface SpotData {
  strip10m: Array<{
    minuteOffset: number; timeKst: string; temperature: number
    skyCode: string; ptyCode: string; precipitation: number
    windSpeed: number; humidity: number; lgt: number
  }>
  observed: {
    temperature: number; humidity: number; windSpeed: number
    skyCode: string; ptyCode: string; precipitation: number; lgt: number
  } | null
  hourly: Array<{
    fcstYmd: string; fcstHour: number; fcstMinute: number
    temperature: number; skyCode: string; ptyCode: string
    precipitation: number; windSpeed: number; humidity: number; lgt: number
    score: { score: number; grade: string }
  }>
  precip10m: Array<{ minuteOffset: number; timeKst: string; precipProb: number; precipMm: number }>
  lightningNow: { level: 'none' | 'watch' | 'warning'; message: string; source: string }
  mountainHourly: Array<{
    fcstYmd: string; fcstHour: number; tempC: number; windMs: number; pop: number;
    visibilityKm: number | null; level: 'good' | 'caution' | 'danger'
  }>
  wildfireHourly: Array<{
    fcstYmd: string; fcstHour: number; score: number; level: 'low' | 'moderate' | 'high' | 'very_high'
  }>
  alerts: Array<{ type: string; level: string; message: string; isLightningRelated: boolean }>
}

// ── Weather data shape ────────────────────────────────────────────────────────
interface WeatherData {
  current: CurrentWeather
  hourly: HourlyForecast[]
  fetchedAt: number
}

// ── Pure helper: period-adjusted display weather ──────────────────────────────
function computeDisplayWeather(
  wData: WeatherData | null,
  hour: number,
  periodPreset: { repHour: number; dayOffset: number },
  scheduleYmd: string,
  activityBand: TimePeriod,
  todayYmdKst: string,
): CurrentWeather | null {
  const base = wData?.current ?? null
  const hourly = wData?.hourly ?? []
  if (!base) return null
  const isPickerNowSlot =
    periodPreset.dayOffset === 0 &&
    getPeriodIndex(periodPreset.repHour) === getPeriodIndex(hour) &&
    scheduleYmd === todayYmdKst
  if (isPickerNowSlot) return base
  const { entry } = resolveHourlyForYmdBand(hourly, scheduleYmd, activityBand, todayYmdKst)
  if (entry) return hourlyToCurrentWeather(entry, { ...base, basisDateKst: scheduleYmd })
  return base
}

// ── Pure helper: period-sliced hourly for strip ────────────────────────────────
function computeDisplayedHourly(
  hourly: HourlyForecast[],
  hour: number,
  activityStartHour: number,
  scheduleYmd: string,
  selectedCalendarDayOffset: number,
  todayYmdKst: string,
): HourlyForecast[] {
  if (!hourly.length) return []
  const toHourNum = (t: string) => parseInt(t.split(':')[0], 10)

  function sliceFromHourOnSameDay(list: HourlyForecast[], minHour: number): HourlyForecast[] {
    if (hour < 12) {
      const todayIdx = list.findIndex(
        (h) => (h.fcstDate === todayYmdKst || !h.fcstDate) && toHourNum(h.time) >= minHour,
      )
      if (todayIdx >= 0) return list.slice(todayIdx)
    }
    const idx = list.findIndex((h) => toHourNum(h.time) >= minHour)
    if (idx >= 0) return list.slice(idx)
    const relaxed = list.findIndex((h) => toHourNum(h.time) >= Math.max(0, minHour - 3))
    return relaxed >= 0 ? list.slice(relaxed) : []
  }

  let usedTomorrowPath = false
  let out: HourlyForecast[]

  {
    const sliceStartHour = activityStartHour
    const selIdx = getPeriodIndex(sliceStartHour)
    const curIdx = getPeriodIndex(hour)
    const dayOff = selectedCalendarDayOffset
    const isTomorrow = dayOff > 0 || selIdx < curIdx

    if (selIdx === curIdx && dayOff === 0) {
      out = sliceFromHourOnSameDay(hourly, samePeriodHourlySliceFloor(hour, curIdx))
    } else if (!isTomorrow) {
      const preNoonFloor = hour < 12 ? TIME_PERIODS[1].start : -1
      const startFloor = Math.max(sliceStartHour, hour, preNoonFloor)
      out = sliceFromHourOnSameDay(hourly, startFloor)
    } else {
      usedTomorrowPath = true
      const dateAwareIdx = hourly.findIndex(
        (h) => h.fcstDate === scheduleYmd && toHourNum(h.time) >= sliceStartHour,
      )
      if (dateAwareIdx >= 0) {
        out = hourly.slice(dateAwareIdx)
      } else {
        const midnightIdx = hourly.findIndex((h, i) =>
          i > 0 && toHourNum(h.time) < toHourNum(hourly[i - 1]!.time),
        )
        if (midnightIdx < 0) {
          out = sliceFromHourOnSameDay(hourly, hour)
        } else {
          const afterMidnight = hourly.slice(midnightIdx)
          const startIdx = afterMidnight.findIndex((h) => toHourNum(h.time) >= sliceStartHour)
          out = startIdx >= 0 ? afterMidnight.slice(startIdx) : afterMidnight
        }
      }
    }
  }

  if (hour < 12 && !usedTomorrowPath) {
    out = orderHourlyStripBeforeNoon(out, hour)
  }
  return out
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function sunsetHmFromText(sunsetTime?: string): string | undefined {
  if (!sunsetTime) return undefined
  const t = sunsetTime.trim()
  const compact = t.includes(':') ? t.replace(':', '') : t
  const hm = parseInt(compact, 10)
  if (!Number.isFinite(hm)) return undefined
  return String(hm).padStart(4, '0')
}

function sunsetHmNumber(sunsetTime?: string): number | null {
  const s = sunsetHmFromText(sunsetTime)
  if (!s) return null
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

function hourlyToCurrentWeather(entry: HourlyForecast, base: CurrentWeather): CurrentWeather {
  return {
    ...base,
    temperature: entry.temperature,
    feelsLike: feelsLike(entry.temperature, entry.windSpeed, entry.humidity),
    humidity: entry.humidity,
    windSpeed: entry.windSpeed,
    skyCode: entry.skyCode,
    ptyCode: entry.ptyCode,
    precipitation: entry.precipitation,
    uvIndex: base.uvIndex,
    basisDateKst: entry.fcstDate ?? base.basisDateKst,
  }
}

function addHoursWrap24(baseHour: number, deltaHour: number): number {
  return (baseHour + deltaHour + 2400) % 24
}

function activityStartFloor(periodStart: number, isNow: boolean, kstHour: number): number {
  return isNow ? (kstHour + 1) % 24 : periodStart
}

function extractDongName(locationName?: string, address?: string): string | undefined {
  const sources = [address ?? '', locationName ?? ''].filter(Boolean)
  for (const src of sources) {
    const tokens = src.split(/\s+/)
    const unit = tokens.find((t) => /(?:동|읍|면|리|가)$/.test(t))
    if (unit) return unit
  }
  return undefined
}

function mountainLevelText(v: 'good' | 'caution' | 'danger'): string {
  if (v === 'danger') return '위험'
  if (v === 'caution') return '주의'
  return '양호'
}

function mountainLevelColor(v: 'good' | 'caution' | 'danger'): string {
  if (v === 'danger') return '#ef4444'
  if (v === 'caution') return '#f59e0b'
  return '#22c55e'
}

function wildfireLevelText(v: 'low' | 'moderate' | 'high' | 'very_high'): string {
  if (v === 'very_high') return '매우 높음'
  if (v === 'high') return '높음'
  if (v === 'moderate') return '보통'
  return '낮음'
}

function wildfireLevelColor(v: 'low' | 'moderate' | 'high' | 'very_high'): string {
  if (v === 'very_high') return '#ef4444'
  if (v === 'high') return '#f97316'
  if (v === 'moderate') return '#f59e0b'
  return '#22c55e'
}

// ── Rough KMA station ID approximation from KMA grid coords ──────────────────
function getRegCodeForLocation(nx: number, ny: number): string {
  if (ny >= 130) return nx >= 75 ? '105' : '101'
  if (nx >= 90) return '159'
  if (nx >= 80 && ny >= 118 && ny <= 128) return '133'
  if (nx <= 52 && ny >= 108) return '156'
  if (nx <= 62 && ny <= 98) return '184'
  if (nx >= 55 && nx <= 75 && ny >= 115 && ny <= 125) return '143'
  if (nx >= 55 && nx <= 70 && ny >= 128 && ny <= 136) return '112'
  return '108'
}

// ── 오늘 강수 예보 그룹 계산 ──────────────────────────────────────────────────────
function computeTodayPrecipAlerts(
  hourly: HourlyForecast[],
  todayYmd: string,
): { groups: PrecipGroup[]; isAllDay: boolean } | null {
  const toHour = (t: string) => parseInt(t.split(':')[0], 10)

  const precipSlots = hourly
    .filter((h) => (h.fcstDate === todayYmd || !h.fcstDate) && h.ptyCode !== '0')
    .map((h) => ({ hour: toHour(h.time), label: weatherLabel(h.skyCode, h.ptyCode) }))
    .sort((a, b) => a.hour - b.hour)

  if (!precipSlots.length) return null

  // 연속 같은 타입 그룹화 (1시간 간격 허용)
  const groups: PrecipGroup[] = []
  for (const { hour, label } of precipSlots) {
    const last = groups[groups.length - 1]
    if (last && last.label === label && hour <= last.endHour + 2) {
      last.endHour = hour
    } else {
      groups.push({ label, startHour: hour, endHour: hour })
    }
  }

  const isAllDay = precipSlots.length >= 12

  return { groups, isAllDay }
}

export default function HomePage() {
  // ── Location + weather ────────────────────────────────────────────────────
  const { location, gpsLoading, gpsError, requestGps, setManualLocation } = useAutoLocation()
  const { data: weatherData, loading: weatherLoading } = useWeather(location)
  const { data: weekly, loading: weeklyLoading } = useWeeklyForecast(location)
  const { favorites, addFavorite, removeFavorite } = useFavoriteLocations()
  const { profile: companionProfile, setProfile: setCompanionProfile } = useCompanionProfile()
  const hour = useNowMinute()
  const hourRef = useRef(hour)
  hourRef.current = hour

  const [dust, setDust] = useState<DustData | null>(null)
  const [pollen, setPollen] = useState<PollenData | null>(null)
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunset | null>(null)
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [openMeteoCompare, setOpenMeteoCompare] = useState<OpenMeteoDailyCompare | null>(null)
  const [mobileLayoutTab, setMobileLayoutTab] = useState<string>('weather')
  // 선택된 모바일 탭을 localStorage에 저장 — 재실행 시 마지막 탭으로 복원
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const t = localStorage.getItem('wf:mobile:tab')
      if (t && ['weather', 'outfit', 'other', 'weekly'].includes(t)) setMobileLayoutTab(t)
    } catch { /* ignore */ }
  }, [])
  const handleMobileTabChange = useCallback((t: string) => {
    setMobileLayoutTab(t)
    if (typeof window === 'undefined') return
    try { localStorage.setItem('wf:mobile:tab', t) } catch { /* ignore */ }
  }, [])

  // ── 강수 알림 팝업 ────────────────────────────────────────────────────────────
  const [precipAlertData, setPrecipAlertData] = useState<{ groups: PrecipGroup[]; isAllDay: boolean } | null>(null)

  // ── Spot data (page-level fetch for suitability bars + precip/lightning) ──
  const [spotData, setSpotData] = useState<SpotData | null>(null)

  // ── Desktop: expandable spot section ─────────────────────────────────────
  const [desktopUltraShortOpen, setDesktopUltraShortOpen] = useState(false)

  // ── Time / period state (for outfit panel) ────────────────────────────────
  // OUTFIT_PERIODS(7개) 기준의 현재 구간을 사용해 「지금」 칩과 초기 선택을 일치시킴.
  // TIME_PERIODS(4개) repHour를 쓰면 10~12·16~18시처럼 OUTFIT 칩에 없는 시간대가 선택돼 이미 지난 구간이 잡힐 수 있음.
  //
  // 서버 렌더는 항상 현재 시각 기준 기본값으로 초기화 → hydration mismatch 회피.
  // 사용자 마지막 선택의 localStorage 복원은 하단 useEffect(첫 마운트)에서 수행:
  //   · 종료 모먼트가 「미래」이면 해당 값으로 setState → 첫 location/weather reset은 ref로 스킵
  //   · 「과거」면 무시하고 현재 시간대 유지
  const [periodPreset, setPeriodPreset] = useState(() => ({
    repHour: OUTFIT_PERIODS[getOutfitPeriodIndex(hour)]!.repHour,
    dayOffset: 0,
  }))
  /** 연속 시간대 범위 선택 시 끝 칩 정보. 단일 선택이면 null */
  const [periodPresetEnd, setPeriodPresetEnd] = useState<{ repHour: number; dayOffset: number } | null>(null)
  const [scheduleYmd, setScheduleYmd] = useState(() => kstTodayYmd())
  const [wxActivityHours, setWxActivityHours] = useState<{ start: number; end: number } | null>(null)

  // 복원 시도가 완료되었는지 — false면 save effect는 발화하지 않음 (복원의 setState가 적용된 다음 렌더부터 저장 시작)
  const [didRestoreAttempt, setDidRestoreAttempt] = useState<boolean>(false)

  const todayYmdKst = kstTodayYmd()
  const presetChipPeriod = useMemo(
    () => OUTFIT_PERIODS[getOutfitPeriodIndex(periodPreset.repHour)]!,
    [periodPreset.repHour],
  )
  const outfitIsNowPeriod =
    periodPreset.dayOffset === 0 &&
    getOutfitPeriodIndex(periodPreset.repHour) === getOutfitPeriodIndex(hour) &&
    scheduleYmd === todayYmdKst

  const fallbackActivityStart = activityStartFloor(presetChipPeriod.start, outfitIsNowPeriod, hour)
  const activityStartHour = wxActivityHours?.start ?? fallbackActivityStart
  const activityEndHour = wxActivityHours?.end ?? addHoursWrap24(fallbackActivityStart, 2)
  const activityBand = TIME_PERIODS[getPeriodIndex(activityStartHour)]

  const selectedCalendarDayOffset = useMemo(
    () => diffCalendarDaysYmd(todayYmdKst, scheduleYmd),
    [todayYmdKst, scheduleYmd],
  )

  const outfitMergedDaily = useMemo(
    () => mergeWeeklyDailyStartingTomorrow(weekly, weatherData?.hourly ?? [], todayYmdKst),
    [weekly, weatherData?.hourly, todayYmdKst],
  )

  const outfitForecastYmdBounds = useMemo(() => {
    const slotYmds = buildHourlySlotYmds(weatherData?.hourly ?? [], todayYmdKst)
    let min = todayYmdKst
    let max = todayYmdKst
    if (slotYmds.length) {
      const uniq = [...new Set(slotYmds)].sort()
      min = uniq[0]!
      max = uniq[uniq.length - 1]!
    }
    for (const row of outfitMergedDaily) {
      if (row.date?.length === 8) {
        if (row.date < min) min = row.date
        if (row.date > max) max = row.date
      }
    }
    if (min < todayYmdKst) min = todayYmdKst
    const cap = addCalendarDaysFromKstYmd(todayYmdKst, 14)
    if (max > cap) max = cap
    return { min, max }
  }, [weatherData?.hourly, outfitMergedDaily, todayYmdKst])

  // ── Suitability bars: build map from spot hourly ──────────────────────────
  const suitabilityByHour = useMemo((): Record<string, { score: number; grade: string }> | undefined => {
    if (!spotData?.hourly?.length) return undefined
    const map: Record<string, { score: number; grade: string }> = {}
    for (const h of spotData.hourly) {
      map[`${h.fcstYmd}-${h.fcstHour}`] = h.score
    }
    return map
  }, [spotData?.hourly])

  // ── Tab 1 hourly: upcoming from current hour ──────────────────────────────
  const tab1HourlyDisplay = useMemo(() => {
    const hourly = weatherData?.hourly ?? []
    if (!hourly.length) return hourly
    const todayYmd = kstTodayYmd()
    const toHourNum = (t: string) => parseInt(t.split(':')[0], 10)
    const idx = hourly.findIndex(
      (h) => (h.fcstDate === todayYmd || !h.fcstDate) && toHourNum(h.time) >= hour
    )
    return idx >= 0 ? hourly.slice(idx) : hourly
  }, [weatherData?.hourly, hour])

  // ── Auto GPS refresh on mount ─────────────────────────────────────────────
  useEffect(() => {
    requestGps({ reason: 'auto', silent: true })
  }, [requestGps])

  // ── 첫 마운트 후 localStorage 복원 (hydration 안전을 위해 useEffect에서 처리) ──
  // 사용자 마지막 선택의 종료 모먼트가 「미래」이면 그 값으로 setState.
  // didRestoreAttempt가 true로 바뀐 다음 렌더부터 save effect가 발화하므로,
  // batched setState로 인한 「복원 직후 default 덮어쓰기」 race를 회피.
  useEffect(() => {
    const snap = getInitialRestoredSnap()
    if (snap) {
      setPeriodPreset(snap.periodPreset)
      setPeriodPresetEnd(snap.periodPresetEnd)
      setScheduleYmd(snap.scheduleYmd)
      setWxActivityHours(snap.wxActivityHours)
    }
    setDidRestoreAttempt(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 외출옷 시간대·날짜 선택은 위치/날씨 페치에 의존하지 않음 (location 자동 reset 제거).
  // 초기 location 해석 시퀀스(DEFAULT → 저장값 → GPS)에서 nx/ny가 한 번이라도 바뀌면 reset이 발화해
  // 복원된 미래 선택을 덮어쓰는 문제를 차단. 위치를 바꾸어도 시간대·날짜 선택은 그대로 유지하고
  // 추천 엔진은 새 위치의 날씨로 자연스럽게 갱신된다.

  // ── 외출옷 시간대·날짜 선택을 localStorage에 영구 저장 ─────────────────────────
  // 복원 시도가 완료된 후 (didRestoreAttempt=true)부터 저장 — 첫 commit의 default 덮어쓰기를 막음.
  useEffect(() => {
    if (!didRestoreAttempt) return
    saveOutfitSched({ periodPreset, periodPresetEnd, scheduleYmd, wxActivityHours })
  }, [didRestoreAttempt, periodPreset, periodPresetEnd, scheduleYmd, wxActivityHours])

  // ── Auto-shift to '지금' when the selected outfit period has passed ────────
  // 시간이 흘러 선택된 오늘 구간이 모두 경과(혹은 칩 목록에 없음)하면 자동으로 현재 OUTFIT_PERIODS 구간으로 보정.
  useEffect(() => {
    if (periodPreset.dayOffset !== 0) return
    if (scheduleYmd !== todayYmdKst) return
    const currentOutfitIdx = getOutfitPeriodIndex(hour)
    const endChipIdx = periodPresetEnd
      ? getOutfitPeriodIndex(periodPresetEnd.repHour)
      : getOutfitPeriodIndex(periodPreset.repHour)
    const endChipDayOffset = periodPresetEnd?.dayOffset ?? 0
    const allPassed = endChipDayOffset === 0 && endChipIdx < currentOutfitIdx
    if (!allPassed) return
    setPeriodPreset({ repHour: OUTFIT_PERIODS[currentOutfitIdx]!.repHour, dayOffset: 0 })
    setPeriodPresetEnd(null)
    setWxActivityHours(null)
  }, [hour, periodPreset.repHour, periodPreset.dayOffset, periodPresetEnd, scheduleYmd, todayYmdKst])

  // ── OpenMeteo compare ────────────────────────────────────────────────────
  useEffect(() => {
    if (!location) return
    const ac = new AbortController()
    setOpenMeteoCompare(null)
    fetch(`/api/weather/compare?lat=${location.lat}&lon=${location.lon}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d: OpenMeteoDailyCompare & { error?: string }) => {
        if (ac.signal.aborted || d?.error) return
        if (d && typeof d.todayMin === 'number' && !Number.isNaN(d.todayMin)) {
          setOpenMeteoCompare({
            yesterdaySameHourTemp:
              typeof d.yesterdaySameHourTemp === 'number' && !Number.isNaN(d.yesterdaySameHourTemp)
                ? d.yesterdaySameHourTemp : null,
            todayMin: d.todayMin,
            todayMax: d.todayMax,
          })
        }
      })
      .catch(() => { /* ignore */ })
    return () => { ac.abort() }
  }, [location])

  // ── Dust / pollen / sunrise / alerts ─────────────────────────────────────
  useEffect(() => {
    if (!location) return
    const { nx, ny, lat, lon } = location
    const ac = new AbortController()

    fetch(`/api/dust?nx=${nx}&ny=${ny}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => { if (!ac.signal.aborted && !d.error) setDust(d) })
      .catch(() => { /* ignore */ })

    const pollenUrl = `/api/pollen?lat=${lat}&lon=${lon}&nx=${nx}&ny=${ny}`
    const fetchPollenWithRetry = async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (ac.signal.aborted) return
        try {
          const r = await fetch(pollenUrl, { signal: ac.signal })
          const d = await r.json()
          if (!d?.error) { setPollen(d); return }
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }
    void fetchPollenWithRetry()

    fetch(`/api/sunrise?lat=${lat}&lon=${lon}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => { if (!ac.signal.aborted && d.sunrise) setSunriseSunset(d) })
      .catch(() => { /* ignore */ })

    const regCode = getRegCodeForLocation(nx, ny)
    fetch(`/api/alert?regCode=${regCode}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => { if (!ac.signal.aborted && Array.isArray(d)) setAlerts(d) })
      .catch(() => { /* ignore */ })

    return () => { ac.abort() }
  }, [location])

  // ── 강수 알림: 4시간 간격으로 반복 표시 ─────────────────────────────────────
  useEffect(() => {
    if (!weatherData?.hourly?.length) return
    const result = computeTodayPrecipAlerts(weatherData.hourly, kstTodayYmd())
    if (!result) return
    if (typeof window === 'undefined') return
    const lastShown = parseInt(localStorage.getItem('wf_precip_alert_ts') ?? '0', 10)
    if (Date.now() - lastShown >= 4 * 60 * 60 * 1000) {
      setPrecipAlertData(result)
    }
  }, [weatherData])

  // ── Spot data fetch (page-level) ──────────────────────────────────────────
  useEffect(() => {
    if (!location) return
    const { nx, ny, lat, lon, name } = location
    const ac = new AbortController()
    const url = `/api/weather/spot?nx=${nx}&ny=${ny}&lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`
    fetch(url, { signal: ac.signal })
      .then((r) => r.json())
      .then((d: SpotData & { error?: string }) => {
        if (ac.signal.aborted || d?.error) return
        setSpotData(d)
      })
      .catch(() => { /* ignore */ })
    return () => { ac.abort() }
  }, [location])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleClosePrecipAlert() {
    localStorage.setItem('wf_precip_alert_ts', String(Date.now()))
    setPrecipAlertData(null)
  }

  function handleSelectLocation(loc: LocationInfo) {
    setManualLocation(loc)
    saveRecentLocation(loc)
  }

  // TimePeriodPicker 칩 클릭: scheduleYmd는 변경하지 않아 롤링 모드 유지
  function handleSelectPreset(repHour: number, dayOffset: number) {
    setPeriodPreset({ repHour, dayOffset })
    setWxActivityHours(null)
  }

  // 날짜 입력·오늘 버튼: scheduleYmd도 함께 변경해 풀데이 모드 전환
  function handleSelectPresetWithDateUpdate(repHour: number, dayOffset: number) {
    setPeriodPreset({ repHour, dayOffset })
    setScheduleYmd(addCalendarDaysFromKstYmd(kstTodayYmd(), dayOffset))
    setWxActivityHours(null)
  }

  function handleRangeSelect(
    _sRepHour: number,
    _sDayOffset: number,
    eRepHour: number,
    eDayOffset: number,
  ) {
    const isSingle = _sRepHour === eRepHour && _sDayOffset === eDayOffset
    setPeriodPresetEnd(isSingle ? null : { repHour: eRepHour, dayOffset: eDayOffset })
  }

  const handleScheduleYmdChange = useCallback((ymd: string) => {
    setScheduleYmd(ymd)
    const off = Math.max(0, diffCalendarDaysYmd(kstTodayYmd(), ymd))
    setPeriodPreset((prev) => ({ ...prev, dayOffset: off }))
    setWxActivityHours(null)
  }, [])

  const period = getTimeOfDay(activityStartHour, sunriseSunset?.sunrise, sunriseSunset?.sunset)

  // periodPreset.dayOffset 기반 실질 날짜: 롤링 모드에서 내일 칩을 눌러도 scheduleYmd는 오늘로 유지하되
  // 날씨·복장 조회는 실제 대상 날짜(dayOffset 반영)를 사용한다
  const effectiveScheduleYmd = useMemo(
    () => periodPreset.dayOffset > 0
      ? addCalendarDaysFromKstYmd(todayYmdKst, periodPreset.dayOffset)
      : scheduleYmd,
    [periodPreset.dayOffset, todayYmdKst, scheduleYmd],
  )

  // ── Display weather ───────────────────────────────────────────────────────
  const displayWeather = useMemo(
    () => computeDisplayWeather(weatherData, hour, periodPreset, effectiveScheduleYmd, activityBand, todayYmdKst),
    [weatherData, hour, periodPreset, effectiveScheduleYmd, activityBand, todayYmdKst],
  )

  // ── Displayed hourly: desktop/outfit period-adjusted ─────────────────────
  const displayedHourly = useMemo(
    () => computeDisplayedHourly(
      weatherData?.hourly ?? [], hour, activityStartHour, effectiveScheduleYmd, selectedCalendarDayOffset, todayYmdKst,
    ),
    [weatherData, hour, activityStartHour, effectiveScheduleYmd, selectedCalendarDayOffset, todayYmdKst],
  )

  const todayWeatherChange = useMemo((): { laterLabel: string; laterPeriodName: string } | null => {
    if (!weatherData?.current) return null
    const hourly = weatherData.hourly ?? []
    const todayYmd = kstTodayYmd()
    const currentLabel = weatherLabel(weatherData.current.skyCode, weatherData.current.ptyCode)

    const periods = [
      { name: '오전', start: 6, end: 11 },
      { name: '오후', start: 12, end: 17 },
      { name: '저녁', start: 18, end: 21 },
      { name: '밤', start: 22, end: 23 },
    ]

    for (const period of periods) {
      if (period.end <= hour) continue
      if (period.start <= hour && hour <= period.end) continue

      const slots = hourly.filter((h) => {
        const hh = parseInt(h.time.split(':')[0], 10)
        return (h.fcstDate === todayYmd || !h.fcstDate) && hh >= period.start && hh <= period.end
      })
      if (!slots.length) continue

      const counts: Record<string, number> = {}
      for (const s of slots) {
        const label = weatherLabel(s.skyCode, s.ptyCode)
        counts[label] = (counts[label] ?? 0) + 1
      }
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      if (dominant && dominant !== currentLabel) {
        return { laterLabel: dominant, laterPeriodName: period.name }
      }
    }
    return null
  }, [weatherData, hour])

  const morningSummary = useMemo((): MorningSummary | null => {
    if (hour < 12) return null
    const hourly = weatherData?.hourly ?? []
    const todayYmd = kstTodayYmd()
    const morning = hourly.filter((h) => {
      const t = parseInt(h.time.split(':')[0], 10)
      return t >= 6 && t < 12 && (h.fcstDate === todayYmd || !h.fcstDate)
    })
    if (morning.length < 2) return null
    const temps = morning.map((h) => h.temperature)
    const minTemp = Math.min(...temps)
    const maxTemp = Math.max(...temps)
    const totalPrecip = morning.reduce((sum, h) => sum + h.precipitation, 0)
    const midSlot = morning.find((h) => h.time === '09:00') ?? morning[Math.floor(morning.length / 2)]
    if (!midSlot) return null
    const wl = weatherLabel(midSlot.skyCode, midSlot.ptyCode)
    return { minTemp, maxTemp, weatherLabel: wl, emoji: weatherEmojiFromLabel(wl), totalPrecip }
  }, [weatherData, hour])

  const uvForCard = useMemo(() => {
    const base = weatherData?.current
    if (!base || !displayWeather) return undefined
    if (displayWeather.uvIndex > 0) return displayWeather.uvIndex
    return base.uvIndex
  }, [weatherData, displayWeather])

  const heroIconSrc = useMemo((): string | undefined => {
    const sunsetHHMM = sunsetHmFromText(sunriseSunset?.sunset)
    const firstHourly = tab1HourlyDisplay[0]
    if (firstHourly) {
      const iconHour = parseInt(firstHourly.time.split(':')[0], 10)
      const tod = getTimeOfDay(iconHour, undefined, sunsetHHMM)
      return `/illust/weather/${illustFile(pickIllustKey(firstHourly.skyCode, firstHourly.ptyCode), tod)}.svg`
    }
    if (!displayWeather) return undefined
    const tod = getTimeOfDay(hour, undefined, sunsetHHMM)
    return `/illust/weather/${illustFile(pickIllustKey(displayWeather.skyCode, displayWeather.ptyCode), tod)}.svg`
  }, [tab1HourlyDisplay, displayWeather, hour, sunriseSunset?.sunset])

  const heroIconHour = tab1HourlyDisplay[0] ? parseInt(tab1HourlyDisplay[0].time.split(':')[0], 10) : hour
  const heroSunsetHm = sunsetHmNumber(sunriseSunset?.sunset)

  const outfitScheduleSyncKey = `${periodPreset.repHour}|${periodPreset.dayOffset}|${periodPresetEnd?.repHour ?? ''}|${periodPresetEnd?.dayOffset ?? ''}`
  const outfitPeriodEndHour = periodPresetEnd
    ? OUTFIT_PERIODS[getOutfitPeriodIndex(periodPresetEnd.repHour)]?.end
    : undefined
  // 범위 선택의 끝 칩 일자 — picker에 넘겨 복원 시 시작~끝 연속 칩을 모두 하이라이트하기 위함
  const effectiveEndScheduleYmd = periodPresetEnd
    ? addCalendarDaysFromKstYmd(todayYmdKst, periodPresetEnd.dayOffset)
    : null

  const currentDongName = extractDongName(location.name, location.address)
  const normalizedLocationName = location.name?.trim()
  const currentPlaceName =
    normalizedLocationName && normalizedLocationName !== currentDongName ? normalizedLocationName : undefined

  // ── Weekly data ───────────────────────────────────────────────────────────
  const weeklyDisplayDaily = useMemo(
    () => mergeWeeklyDailyStartingTomorrow(weekly, weatherData?.hourly ?? [], todayYmdKst),
    [weekly, weatherData?.hourly, todayYmdKst],
  )
  // 모바일 주간예보 탭용 — 오늘 포함 최대 8일
  const weeklyDailyFromToday = useMemo(
    () => mergeWeeklyDailyFromToday(weekly, weatherData?.hourly ?? [], todayYmdKst),
    [weekly, weatherData?.hourly, todayYmdKst],
  )
  const weeklyProps = {
    daily: weeklyDisplayDaily,
    hourly: weatherData?.hourly ?? [],
    loading: weeklyLoading && weeklyDisplayDaily.length === 0,
  } as const

  // ── Shared UI nodes ───────────────────────────────────────────────────────
  const locationSearch = <LocationSearchBar onSelect={handleSelectLocation} />
  const recentChips = <RecentChips onSelect={handleSelectLocation} currentName={location.name} />

  const highlightsGrid = (
    <HighlightsGrid weather={displayWeather} dust={dust} pollen={pollen} loading={weatherLoading} compact />
  )
  const weatherCard = (
    <WeatherCard
      weather={displayWeather}
      period={period}
      heroIconSrc={heroIconSrc}
      heroIconHour={heroIconHour}
      heroSunsetHm={heroSunsetHm}
      loading={weatherLoading}
      addressLine={location.address}
      sunriseSunset={sunriseSunset}
      uvDisplay={uvForCard}
      dust={dust}
      alerts={alerts}
      openMeteoCompare={openMeteoCompare}
      morningSummary={morningSummary}
      futureDaily={weeklyDisplayDaily.slice(0, 2)}
      todayWeatherChange={todayWeatherChange}
    />
  )

  const timePeriodPicker = (
    <TimePeriodPicker
      currentHour={hour}
      currentConditions={
        weatherData?.current
          ? {
              temperature: weatherData.current.temperature,
              skyCode: weatherData.current.skyCode,
              ptyCode: weatherData.current.ptyCode,
            }
          : null
      }
      hourly={weatherData?.hourly ?? []}
      selectedRepHour={periodPreset.repHour}
      selectedScheduleYmd={effectiveScheduleYmd}
      selectedEndRepHour={periodPresetEnd?.repHour ?? null}
      selectedEndScheduleYmd={effectiveEndScheduleYmd}
      sunsetTime={sunriseSunset?.sunset}
      onSelectPreset={handleSelectPreset}
      onRangeSelect={handleRangeSelect}
    />
  )

  const outfitPanelProps = {
    weather: displayWeather,
    hourly: weatherData?.hourly ?? [],
    daily: outfitMergedDaily,
    dust,
    alerts,
    terrain: location.terrain ?? 'urban',
    outfitPeriodStartHour: presetChipPeriod.start,
    outfitPeriodEndHour,
    outfitIsNowPeriod,
    outfitCurrentKstHour: hour,
    outfitScheduleSyncKey,
    scheduleYmd: effectiveScheduleYmd,
    scheduleYmdMin: outfitForecastYmdBounds.min,
    scheduleYmdMax: outfitForecastYmdBounds.max,
    onScheduleYmdChange: handleScheduleYmdChange,
    activityStartHourMin: outfitIsNowPeriod ? (hour + 1) % 24 : 0,
    onActivityHoursChange: (s: number, e: number) => setWxActivityHours({ start: s, end: e }),
    sunsetTime: sunriseSunset?.sunset,
    sunriseTime: sunriseSunset?.sunrise,
  }
  const outfitPanel = <OutfitPanel {...outfitPanelProps} variant="default" />
  const outfitPanelMobile = <OutfitPanel {...outfitPanelProps} variant="mobileSheet" />

  // ── Desktop: hourly strips ────────────────────────────────────────────────
  const hourlyStripDesktop = (
    <HourlyWeatherStrip
      hourly={displayedHourly}
      currentHour={hour}
      selectedPeriodStart={activityStartHour}
      selectedPeriodEnd={activityEndHour}
      selectedDayOffset={selectedCalendarDayOffset}
      highlightTargetYmd={scheduleYmd}
      sunsetTime={sunriseSunset?.sunset}
    />
  )

  // ── Mobile Tab 1 header ───────────────────────────────────────────────────
  const tab1Header = (
    <div className="px-3 pt-3 pb-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1 min-w-0">{locationSearch}</div>
        <button
          onClick={() => requestGps()}
          disabled={gpsLoading}
          className="flex items-center justify-center transition-all active:opacity-80 flex-shrink-0"
          style={{
            width: 44, height: 44, borderRadius: 8, fontSize: 20,
            color: gpsLoading ? 'var(--muted)' : 'var(--humidity)',
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}
          aria-label="내 위치로 설정"
        >
          {gpsLoading ? '⟳' : '📍'}
        </button>
      </div>
      {gpsError && <p className="text-xs mt-1 px-1" style={{ color: 'var(--danger)' }}>{gpsError}</p>}
      <div className="mt-2">{recentChips}</div>
      <div className="mt-1.5">
        <FavoriteChips
          favorites={favorites}
          currentLocation={location}
          onSelect={handleSelectLocation}
          onAdd={addFavorite}
          onRemove={removeFavorite}
        />
      </div>
    </div>
  )

  // ── Mobile Tab 2 header (외출옷) ──────────────────────────────────────────
  const tab2Header = (
    <div className="px-3 pt-2 pb-1 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs flex-1 min-w-0 truncate" style={{ color: 'var(--muted)' }}>
          📍 {location.name} 날씨 기준
        </p>
        <input
          type="date"
          className="text-xs rounded-lg px-2 py-1.5 outline-none flex-shrink-0"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            maxWidth: 130,
          }}
          value={scheduleYmd.length === 8
            ? `${scheduleYmd.slice(0, 4)}-${scheduleYmd.slice(4, 6)}-${scheduleYmd.slice(6, 8)}`
            : ''}
          min={outfitForecastYmdBounds.min.length === 8
            ? `${outfitForecastYmdBounds.min.slice(0, 4)}-${outfitForecastYmdBounds.min.slice(4, 6)}-${outfitForecastYmdBounds.min.slice(6, 8)}`
            : ''}
          max={outfitForecastYmdBounds.max.length === 8
            ? `${outfitForecastYmdBounds.max.slice(0, 4)}-${outfitForecastYmdBounds.max.slice(4, 6)}-${outfitForecastYmdBounds.max.slice(6, 8)}`
            : ''}
          onChange={(e) => {
            if (!e.target.value) return
            const newYmd = e.target.value.replace(/-/g, '')
            const dayOff = Math.max(0, diffCalendarDaysYmd(todayYmdKst, newYmd))
            if (dayOff === 0) {
              // 오늘: 현재 OUTFIT 구간(=「지금」칩)으로 복귀
              handleSelectPresetWithDateUpdate(OUTFIT_PERIODS[getOutfitPeriodIndex(hour)]!.repHour, 0)
            } else {
              // 미래 날짜: 새벽(0시)부터 시작
              handleSelectPresetWithDateUpdate(OUTFIT_PERIODS[0]!.repHour, dayOff)
            }
          }}
        />
        {scheduleYmd !== todayYmdKst && (
          <button
            type="button"
            onClick={() => handleSelectPresetWithDateUpdate(OUTFIT_PERIODS[getOutfitPeriodIndex(hour)]!.repHour, 0)}
            className="flex-shrink-0 text-xs px-2 py-1.5 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            오늘
          </button>
        )}
      </div>
      {timePeriodPicker}
      <div className="flex gap-1.5 overflow-x-auto scroll-strip">
        {COMPANION_PROFILES.map(p => (
          <button
            key={p.key}
            onClick={() => setCompanionProfile(p.key)}
            className="flex-shrink-0 rounded-full transition-all active:opacity-70"
            style={{
              fontSize: 12,
              padding: '4px 12px',
              background: companionProfile === p.key ? 'var(--primary-tint-12)' : 'var(--surface)',
              border: `1px solid ${companionProfile === p.key ? 'var(--colors-primary)' : 'var(--border)'}`,
              color: companionProfile === p.key ? 'var(--primary)' : 'var(--muted)',
              fontWeight: companionProfile === p.key ? 600 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>
    </div>
  )

  // ── Mobile Tab 3 header (기타 기상정보) ────────────────────────────────────
  const tab3Header = (
    <div className="px-3 pt-2 pb-1">
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        📍 {location.name}
      </p>
    </div>
  )

  // ── Mobile Tab 1 content ──────────────────────────────────────────────────
  const tab1Content = (
    <>
      {weatherCard}
      <HourlyWeatherStrip
        hourly={tab1HourlyDisplay}
        currentHour={hour}
        sunsetTime={sunriseSunset?.sunset}
        suitabilityByHour={suitabilityByHour}
      />
      {spotData && (
        <UltraSrtFcstCard
          strip10m={spotData.strip10m.filter(s => s.minuteOffset <= 120)}
          lightningNow={spotData.lightningNow}
        />
      )}
      <ChartErrorBoundary>
        <TempGraph48h
          hourly={weatherData?.hourly ?? []}
          loading={weatherLoading && !weatherData}
          sunriseSunset={sunriseSunset}
          daily={weeklyDisplayDaily}
        />
      </ChartErrorBoundary>
    </>
  )

  // ── Mobile Tab 2 content (외출옷) ─────────────────────────────────────────
  const tab2Content = (
    <>
      {weatherLoading && !weatherData && (
        <div className="h-8 animate-pulse rounded-lg" style={{ background: 'var(--colors-surface-soft)' }} />
      )}
      <OutfitChecklist
        weather={displayWeather}
        dust={dust}
        hourly={weatherData?.hourly ?? []}
        profile={companionProfile}
      />
      {outfitPanelMobile}
    </>
  )

  // ── Mobile Tab 3 content (기타 기상정보) ─────────────────────────────────
  const combinedAlerts = useMemo(() => {
    const spotAlerts = spotData?.alerts ?? []
    const mainAlerts = alerts.map(a => ({ type: a.type, level: a.level, message: a.message, isLightningRelated: false }))
    const seen = new Set<string>()
    return [...mainAlerts, ...spotAlerts].filter(a => {
      const key = `${a.type}|${a.message}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [alerts, spotData?.alerts])

  const tab3Content = (
    <>
      {/* 자외선 / 오존 — 대기정보와 동일 스타일 */}
      <div>
        <h2 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
          일사·오존
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          <HighlightCard
            compact
            icon="☀️"
            label="자외선지수"
            value={uvForCard != null ? `UV ${uvForCard}` : '--'}
            sub={uvLabel(uvForCard ?? 0)}
            accent={uvColor(uvForCard ?? 0)}
          />
          <HighlightCard
            compact
            icon="⚗️"
            label="오존"
            value={o3GradeLabel(dust?.o3Grade)}
            sub={dust?.o3Value != null ? `${dust.o3Value.toFixed(3)} ppm` : ''}
            accent={o3GradeColor(dust?.o3Grade)}
          />
        </div>
      </div>

      {highlightsGrid}

      {/* 기상특보 */}
      <div
        className="glass-card p-3"
        style={combinedAlerts.length > 0 ? { border: '1px solid rgba(220,38,38,0.25)', background: 'rgba(239,68,68,0.03)' } : undefined}
      >
        <h3
          className="text-base font-semibold mb-2.5"
          style={{ color: combinedAlerts.length > 0 ? 'var(--danger)' : 'var(--muted)' }}
        >
          ⚠️ 기상특보
        </h3>
        {combinedAlerts.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>현재 발효 중인 특보가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {combinedAlerts.map((a, i) => (
              <div
                key={i}
                className="flex gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}
              >
                <span className="text-sm flex-shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: '#b91c1c' }}>
                    {a.type} · {a.level}
                  </p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>
                    {a.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mountain weather */}
      {spotData?.mountainHourly && spotData.mountainHourly.length > 0 && (
        <div className="glass-card p-3">
          <h3 className="text-base font-semibold mb-2.5" style={{ color: 'var(--muted)' }}>
            산악 기상
          </h3>
          <div className="flex gap-1.5 overflow-x-auto scroll-strip pb-1">
            {spotData.mountainHourly.slice(0, 12).map((m, i) => (
              <div
                key={`${m.fcstYmd}-${m.fcstHour}-${i}`}
                className="flex-shrink-0 flex flex-col gap-0.5 rounded-xl px-2 py-2 min-w-[64px] text-center"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)' }}
              >
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
                  {String(m.fcstHour).padStart(2, '0')}시
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: mountainLevelColor(m.level) }}>
                  {mountainLevelText(m.level)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text)' }}>{m.tempC.toFixed(0)}°</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{m.windMs.toFixed(0)}m/s</span>
                {m.pop > 0 && <span style={{ fontSize: 10, color: 'var(--humidity)' }}>{m.pop}%</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wildfire risk */}
      {spotData?.wildfireHourly && spotData.wildfireHourly.length > 0 && (
        <div className="glass-card p-3">
          <h3 className="text-base font-semibold mb-2.5" style={{ color: 'var(--muted)' }}>
            산불 위험도
          </h3>
          <div className="flex gap-1.5 overflow-x-auto scroll-strip pb-1">
            {spotData.wildfireHourly.slice(0, 12).map((w, i) => (
              <div
                key={`${w.fcstYmd}-${w.fcstHour}-${i}`}
                className="flex-shrink-0 flex flex-col gap-0.5 rounded-xl px-2 py-2 min-w-[64px] text-center"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)' }}
              >
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
                  {String(w.fcstHour).padStart(2, '0')}시
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: wildfireLevelColor(w.level) }}>
                  {wildfireLevelText(w.level)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>점수 {w.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  // ── Mobile Tab 4 (주간예보) ──────────────────────────────────────────────
  const weeklyLocationLabel = currentPlaceName ?? currentDongName ?? location.name?.trim() ?? '내 위치'
  const tab4Header = (
    <div className="px-4 py-3 flex items-center justify-between">
      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{weeklyLocationLabel}</p>
      <span className="text-[11px]" style={{ color: 'var(--muted)' }}>주간예보</span>
    </div>
  )
  const tab4Content = (
    <>
      <WeeklyForecastHero locationName={weeklyLocationLabel} />
      {weeklyLoading && weeklyDailyFromToday.length === 0 ? (
        <div className="h-64 animate-pulse rounded-2xl" style={{ background: 'var(--colors-surface-soft)' }} />
      ) : (
        <WeeklyForecastListMobile daily={weeklyDailyFromToday} locationName={weeklyLocationLabel} />
      )}
      <p className="text-[10px] text-center pt-1" style={{ color: 'var(--muted)' }}>
        기상청 단기예보(오늘~+2일) + 중기예보(+3~+7일) · 오전 07~12시 / 오후 13~18시 기준 강수확률
      </p>
    </>
  )

  // ── Desktop top ───────────────────────────────────────────────────────────
  const desktopTop = (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[min(100%,280px)]">{locationSearch}</div>
        <GpsButton loading={gpsLoading} error={gpsError} onClick={requestGps} />
        {currentDongName && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-md"
            style={{ color: 'var(--muted)', background: 'var(--colors-canvas)', border: '1px solid var(--border)' }}
            title={`현재 조회 위치: ${currentDongName}`}
          >
            {currentDongName}
          </span>
        )}
        {currentPlaceName && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-md"
            style={{ color: 'var(--humidity)', background: 'var(--primary-tint-12)', border: '1px solid var(--border)' }}
            title={`조회 장소: ${currentPlaceName}`}
          >
            {currentPlaceName}
          </span>
        )}
      </div>
      {gpsError && <p className="text-xs px-0.5" style={{ color: 'var(--danger)' }}>{gpsError}</p>}
      <div className="space-y-2 min-w-0">
        {recentChips}
      </div>

      <div
        className="rounded-lg overflow-hidden w-full min-w-0"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.02]"
          style={{ color: 'var(--text)' }}
          aria-expanded={desktopUltraShortOpen}
          onClick={() => setDesktopUltraShortOpen(o => !o)}
        >
          <span className="text-sm font-bold">초단기 기상정보</span>
          <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--muted)' }}>
            {desktopUltraShortOpen ? '접기' : '펼치기'}
          </span>
        </button>
        {desktopUltraShortOpen && (
          <div className="px-3 pb-3 pt-1 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <SpotPanel compact anchorLocation={location} showLocationSearch={false} />
          </div>
        )}
      </div>
    </div>
  )

  const locationSummaryLine =
    location.address?.trim() || location.name?.trim() || '위치를 검색하거나 GPS로 설정해 주세요'

  return (
    <>
      {/* ── Mobile (< lg) ── */}
      <div className="lg:hidden">
        <MobileLayout
          selectedTab={mobileLayoutTab}
          onTabChange={handleMobileTabChange}
          tabs={[
            {
              key: 'weather',
              icon: '🌤',
              label: '관심지역 날씨',
              header: tab1Header,
              content: tab1Content,
            },
            {
              key: 'outfit',
              icon: '👔',
              label: '외출옷 추천',
              header: tab2Header,
              content: tab2Content,
            },
            {
              key: 'weekly',
              icon: '📅',
              label: '주간예보',
              header: tab4Header,
              content: tab4Content,
            },
            {
              key: 'other',
              icon: '📊',
              label: '기타 날씨 정보',
              header: tab3Header,
              content: tab3Content,
            },
          ]}
        />
      </div>

      {/* ── Desktop (≥ lg) ── */}
      <div className="hidden lg:block">
        <DashboardShell
          top={desktopTop}
          left={
            <>
              {weatherCard}
              {highlightsGrid}
              {hourlyStripDesktop}
              <ChartErrorBoundary>
                <TempGraph48h
                  hourly={weatherData?.hourly ?? []}
                  loading={weatherLoading && !weatherData}
                  sunriseSunset={sunriseSunset}
                />
              </ChartErrorBoundary>
              <ChartErrorBoundary>
                <WeeklyForecastInline key="weekly-inline-desktop" {...weeklyProps} />
              </ChartErrorBoundary>
            </>
          }
          right={
            <>
              {timePeriodPicker}
              {outfitPanel}
            </>
          }
        />
      </div>

      {/* ── 강수 알림 팝업 (당일 첫 진입 1회) ── */}
      {precipAlertData && (
        <PrecipAlertModal
          groups={precipAlertData.groups}
          isAllDay={precipAlertData.isAllDay}
          onClose={handleClosePrecipAlert}
        />
      )}

      <div className="hidden" aria-hidden>
        <span>{locationSummaryLine}</span>
      </div>
    </>
  )
}

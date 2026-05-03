'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { LocationSearchBar } from '@/components/weather/LocationSearchBar'
import { LocationSourcePicker } from '@/components/weather/LocationSourcePicker'
import { InterestLocationCard } from '@/components/weather/InterestLocationCard'
import { GpsButton } from '@/components/weather/GpsButton'
import { RecentChips, saveRecentLocation } from '@/components/weather/RecentChips'
import { WeatherCard } from '@/components/weather/WeatherCard'
import { HourlyWeatherStrip } from '@/components/weather/HourlyWeatherStrip'
import dynamic from 'next/dynamic'
const WeeklyForecastInline = dynamic(
  () => import('@/components/weather/WeeklyForecastInline').then((m) => m.WeeklyForecastInline),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-lg" style={{ background: 'var(--colors-surface-soft)' }} /> }
)
import { HighlightsGrid } from '@/components/weather/HighlightsGrid'
import { TimePeriodPicker } from '@/components/weather/TimePeriodPicker'
import { OutfitPanel } from '@/components/outfit/OutfitPanel'
import { NearbyWeatherChips } from '@/components/weather/NearbyWeatherChips'
import { SpotPanel } from '@/components/spot/SpotPanel'
import { useAutoLocation } from '@/lib/hooks/useAutoLocation'
import { useWeather } from '@/lib/hooks/useWeather'
import { useWeeklyForecast } from '@/lib/hooks/useWeeklyForecast'
import {
  getTimeOfDay,
  kstTodayYmd,
  diffCalendarDaysYmd,
  addCalendarDaysFromKstYmd,
} from '@/lib/utils/timeOfDay'
import { useNowMinute } from '@/lib/hooks/useNowMinute'
import { feelsLike, weatherLabel, weatherEmojiFromLabel, pickIllustKey, illustFile } from '@/lib/utils/formatWeather'
import {
  TIME_PERIODS,
  getPeriodIndex,
  getPreviousCompletedPeriod,
  samePeriodHourlySliceFloor,
  orderHourlyStripBeforeNoon,
  type TimePeriod,
} from '@/lib/utils/timePeriods'
import { buildHourlySlotYmds, resolveHourlyForYmdBand } from '@/lib/utils/resolveHourlyForPeriod'
import { mergeWeeklyDailyStartingTomorrow } from '@/lib/weather/weeklyFromTomorrow'
import type {
  DustData,
  PollenData,
  SunriseSunset,
  WeatherAlert,
  CurrentWeather,
  HourlyForecast,
  PreviousPeriodWeatherSummary,
  MorningSummary,
} from '@/types/weather'
import type { LocationInfo } from '@/types/location'
import type { OpenMeteoDailyCompare } from '@/lib/weather/openMeteoCompare'
import type { VisitSchedule } from '@/lib/utils/visitSchedule'
import {
  defaultVisitSchedule,
  migrateLegacyVisitSchedule,
  normalizeVisitScheduleIfPast,
  repHourForVisitSchedule,
  schedulesEqual,
} from '@/lib/utils/visitSchedule'

export type { VisitSchedule } from '@/lib/utils/visitSchedule'

// ── Tab 3/4 source types ──────────────────────────────────────────────────────
type Tab3Source = 'tab1' | 'tab2'
type Tab4Source = 'tab1' | 'tab2'

// ── Weather data shape (same as useWeather return) ───────────────────────────
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
  if (isPickerNowSlot) {
    const hourStr = String(hour).padStart(2, '0') + ':00'
    const entry = hourly.find((h) => h.time === hourStr) ?? null
    return entry ? hourlyToCurrentWeather(entry, base) : base
  }
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

const TAB2_STORAGE_KEY = 'weatherfit:interestLocation'
const INTEREST_SCHEDULE_KEY = 'weatherfit:interestSchedule'

// ── Rough KMA station ID approximation from KMA grid coords ─────────────────
function getRegCodeForLocation(nx: number, ny: number): string {
  if (ny >= 130) return nx >= 75 ? '105' : '101'       // 강릉 / 춘천
  if (nx >= 90) return '159'                            // 부산
  if (nx >= 80 && ny >= 118 && ny <= 128) return '133' // 대구
  if (nx <= 52 && ny >= 108) return '156'               // 광주
  if (nx <= 62 && ny <= 98) return '184'                // 제주
  if (nx >= 55 && nx <= 75 && ny >= 115 && ny <= 125) return '143' // 대전
  if (nx >= 55 && nx <= 70 && ny >= 128 && ny <= 136) return '112' // 인천
  return '108'                                          // 서울 (기본)
}

export default function HomePage() {
  // ── Tab 1: auto GPS location ──────────────────────────────────────────────
  const { location, gpsLoading, gpsError, requestGps, setManualLocation } = useAutoLocation()
  const { data: weatherData, loading: weatherLoading } = useWeather(location)
  const { data: weekly, loading: weeklyLoading } = useWeeklyForecast(location)
  const hour = useNowMinute()

  const [dust, setDust] = useState<DustData | null>(null)
  const [pollen, setPollen] = useState<PollenData | null>(null)
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunset | null>(null)
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [openMeteoCompare, setOpenMeteoCompare] = useState<OpenMeteoDailyCompare | null>(null)

  // ── Tab 2: pinned interest location ──────────────────────────────────────
  const [tab2Location, setTab2Location] = useState<LocationInfo | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TAB2_STORAGE_KEY)
      if (raw) setTab2Location(JSON.parse(raw) as LocationInfo)
    } catch { /* ignore */ }
  }, [])
  const handleSaveTab2Location = useCallback((loc: LocationInfo) => {
    setTab2Location(loc)
    try { localStorage.setItem(TAB2_STORAGE_KEY, JSON.stringify(loc)) } catch { /* ignore */ }
  }, [])
  const { data: tab2WeatherData, loading: tab2WeatherLoading } = useWeather(tab2Location)
  const { data: tab2Weekly } = useWeeklyForecast(tab2Location ?? location)
  const [tab2Alerts, setTab2Alerts] = useState<WeatherAlert[]>([])
  const [tab2VisitSchedule, setTab2VisitSchedule] = useState<VisitSchedule | null>(null)

  // ── 관심 일정: 저장소 로드·과거 구간 보정 ───────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(INTEREST_SCHEDULE_KEY)
      if (raw) {
        const p = JSON.parse(raw) as unknown
        const migrated = migrateLegacyVisitSchedule(p, kstTodayYmd())
        if (migrated) {
          setTab2VisitSchedule(normalizeVisitScheduleIfPast(migrated, kstTodayYmd(), hour))
          return
        }
      }
    } catch { /* ignore */ }
    setTab2VisitSchedule(defaultVisitSchedule(hour))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- 초기 하이드레이션만

  useEffect(() => {
    if (!tab2VisitSchedule) return
    try {
      localStorage.setItem(INTEREST_SCHEDULE_KEY, JSON.stringify(tab2VisitSchedule))
    } catch { /* ignore */ }
  }, [tab2VisitSchedule])

  useEffect(() => {
    if (!tab2VisitSchedule) return
    const n = normalizeVisitScheduleIfPast(tab2VisitSchedule, kstTodayYmd(), hour)
    if (!schedulesEqual(n, tab2VisitSchedule)) setTab2VisitSchedule(n)
  }, [hour, tab2VisitSchedule])

  // ── Tab 3: outfit location source ─────────────────────────────────────────
  const [tab3Source, setTab3Source] = useState<Tab3Source>('tab1')
  useEffect(() => {
    if (tab3Source === 'tab2' && !tab2Location) setTab3Source('tab1')
  }, [tab2Location, tab3Source])

  // ── Tab 4: spot location source ────────────────────────────────────────────
  const [tab4Source, setTab4Source] = useState<Tab4Source>('tab1')
  /** PC 상단 「초단기 기상정보」 접기(기본 접힘) */
  const [desktopUltraShortOpen, setDesktopUltraShortOpen] = useState(false)
  useEffect(() => {
    if (tab4Source === 'tab2' && !tab2Location) setTab4Source('tab1')
  }, [tab2Location, tab4Source])

  // ── Outfit effective location + weather ───────────────────────────────────
  const outfitLocation = useMemo((): LocationInfo => {
    if (tab3Source === 'tab2' && tab2Location) return tab2Location
    return location
  }, [tab3Source, tab2Location, location])

  const outfitWeatherData = useMemo((): WeatherData | null => {
    if (tab3Source === 'tab2') return tab2WeatherData ?? weatherData
    return weatherData
  }, [tab3Source, tab2WeatherData, weatherData])

  const { data: outfitWeeklyRaw } = useWeeklyForecast(outfitLocation)

  // ── Spot effective location (Tab 4) ──────────────────────────────────────
  const spotLocation = useMemo((): LocationInfo => {
    if (tab4Source === 'tab2' && tab2Location) return tab2Location
    return location
  }, [tab4Source, tab2Location, location])

  // ── Time / period state ───────────────────────────────────────────────────
  const [periodPreset, setPeriodPreset] = useState(() => ({
    repHour: TIME_PERIODS[getPeriodIndex(hour)].repHour,
    dayOffset: 0,
  }))
  const [scheduleYmd, setScheduleYmd] = useState(() => kstTodayYmd())
  const [wxActivityHours, setWxActivityHours] = useState<{ start: number; end: number } | null>(null)

  const todayYmdKst = kstTodayYmd()
  const presetChipPeriod = useMemo(
    () => TIME_PERIODS.find((p) => p.repHour === periodPreset.repHour) ?? TIME_PERIODS[2],
    [periodPreset.repHour],
  )
  const outfitIsNowPeriod =
    periodPreset.dayOffset === 0 &&
    getPeriodIndex(periodPreset.repHour) === getPeriodIndex(hour) &&
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
    () => mergeWeeklyDailyStartingTomorrow(outfitWeeklyRaw, outfitWeatherData?.hourly ?? [], todayYmdKst),
    [outfitWeeklyRaw, outfitWeatherData?.hourly, todayYmdKst],
  )

  /** 시간별만 있을 때보다 일별이 길면 날짜 선택 범위 확장 */
  const outfitForecastYmdBounds = useMemo(() => {
    const slotYmds = buildHourlySlotYmds(outfitWeatherData?.hourly ?? [], todayYmdKst)
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
  }, [outfitWeatherData?.hourly, outfitMergedDaily, todayYmdKst])

  // ── Auto GPS refresh on mount ─────────────────────────────────────────────
  useEffect(() => {
    requestGps({ reason: 'auto', silent: true })
  }, [requestGps])

  // Reset period on location change
  useEffect(() => {
    setPeriodPreset({ repHour: TIME_PERIODS[getPeriodIndex(hour)].repHour, dayOffset: 0 })
    setScheduleYmd(kstTodayYmd())
    setWxActivityHours(null)
  }, [location])

  useEffect(() => {
    if (weatherData) {
      setPeriodPreset({ repHour: TIME_PERIODS[getPeriodIndex(hour)].repHour, dayOffset: 0 })
      setScheduleYmd(kstTodayYmd())
      setWxActivityHours(null)
    }
  }, [weatherData])

  function handleSelectPreset(repHour: number, dayOffset: number) {
    setPeriodPreset({ repHour, dayOffset })
    setScheduleYmd(addCalendarDaysFromKstYmd(kstTodayYmd(), dayOffset))
    setWxActivityHours(null)
  }

  /** 관심지역 탭 일정 → 복장 기준일·시간대 동기화 (날씨 최초 로드 시 기간 리셋 이후에도 다시 맞춤) */
  useEffect(() => {
    if (!tab2VisitSchedule) return
    const ymd = tab2VisitSchedule.visitDateYmd
    setScheduleYmd(ymd)
    const dayOff = Math.max(0, diffCalendarDaysYmd(kstTodayYmd(), ymd))
    setPeriodPreset({
      repHour: repHourForVisitSchedule(tab2VisitSchedule),
      dayOffset: dayOff,
    })
    setWxActivityHours({ start: tab2VisitSchedule.startHour, end: tab2VisitSchedule.endHour })
  }, [tab2VisitSchedule, weatherData])

  const period = getTimeOfDay(activityStartHour, sunriseSunset?.sunrise, sunriseSunset?.sunset)

  // ── Display weather: Tab 1 (period-adjusted from Tab 1 location) ──────────
  const displayWeather = useMemo(
    () => computeDisplayWeather(weatherData, hour, periodPreset, scheduleYmd, activityBand, todayYmdKst),
    [weatherData, hour, periodPreset, scheduleYmd, activityBand, todayYmdKst],
  )

  // ── Display weather: outfit (from outfit location) ────────────────────────
  const outfitDisplayWeather = useMemo(
    () => computeDisplayWeather(outfitWeatherData, hour, periodPreset, scheduleYmd, activityBand, todayYmdKst),
    [outfitWeatherData, hour, periodPreset, scheduleYmd, activityBand, todayYmdKst],
  )

  const outfitScheduleSyncKey = `${periodPreset.repHour}|${periodPreset.dayOffset}|${tab2VisitSchedule?.visitDateYmd ?? ''}|${tab2VisitSchedule?.startHour ?? ''}`

  // ── Displayed hourly: Tab 1 ───────────────────────────────────────────────
  const displayedHourly = useMemo(
    () => computeDisplayedHourly(
      weatherData?.hourly ?? [], hour, activityStartHour, scheduleYmd, selectedCalendarDayOffset, todayYmdKst,
    ),
    [weatherData, hour, activityStartHour, scheduleYmd, selectedCalendarDayOffset, todayYmdKst],
  )

  // ── Tab 2: effective location + weather (Tab 1 fallback when not pinned) ──
  const tab2EffectiveLocation = tab2Location ?? location
  const tab2EffectiveWeather = tab2WeatherData ?? (tab2Location ? null : weatherData)
  const tab2IsFallback = !tab2Location

  // ── Tab 2: weekly display ─────────────────────────────────────────────────
  const tab2WeeklyDisplay = useMemo(
    () => mergeWeeklyDailyStartingTomorrow(tab2Weekly, tab2EffectiveWeather?.hourly ?? [], todayYmdKst),
    [tab2Weekly, tab2EffectiveWeather?.hourly, todayYmdKst],
  )

  // ── Tab 2: alerts ─────────────────────────────────────────────────────────
  useEffect(() => {
    const { nx, ny } = tab2EffectiveLocation
    const regCode = getRegCodeForLocation(nx, ny)
    const ac = new AbortController()
    fetch(`/api/alert?regCode=${regCode}`, { signal: ac.signal })
      .then(r => r.json())
      .then(d => { if (!ac.signal.aborted && Array.isArray(d)) setTab2Alerts(d) })
      .catch(() => { /* ignore */ })
    return () => { ac.abort() }
  }, [tab2EffectiveLocation.nx, tab2EffectiveLocation.ny]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab 2 hourly: upcoming from current hour (Tab 1 fallback) ─────────────
  const tab2HourlyDisplay = useMemo(() => {
    const hourly = (tab2Location ? tab2WeatherData : weatherData)?.hourly ?? []
    if (!hourly.length) return []
    const toHourNum = (t: string) => parseInt(t.split(':')[0], 10)
    const idx = hourly.findIndex(h => toHourNum(h.time) >= hour)
    return idx >= 0 ? hourly.slice(idx) : hourly
  }, [tab2Location, tab2WeatherData, weatherData, hour])

  // ── Previous period / morning summary ────────────────────────────────────
  const previousPeriodSummary = useMemo((): PreviousPeriodWeatherSummary | null => {
    const hourly = weatherData?.hourly ?? []
    if (!hourly.length) return null
    const prev = getPreviousCompletedPeriod(hour)
    if (!prev) return null
    const toHourNum = (t: string) => parseInt(t.split(':')[0], 10)
    const repStr = String(prev.repHour).padStart(2, '0') + ':00'
    let entry = hourly.find((h) => h.time === repStr) ?? null
    if (!entry) {
      const candidates = hourly.filter((h) => {
        const t = toHourNum(h.time)
        return t >= prev.start && t <= prev.end && t < hour
      })
      entry = candidates.length ? candidates[candidates.length - 1]! : null
    }
    if (!entry) return null
    const wl = weatherLabel(entry.skyCode, entry.ptyCode)
    return {
      periodLabel: prev.label,
      weatherLabel: wl,
      emoji: weatherEmojiFromLabel(wl),
      temperature: entry.temperature,
      feelsLike: feelsLike(entry.temperature, entry.windSpeed, entry.humidity),
    }
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
    const firstHourly = displayedHourly[0]
    if (firstHourly) {
      const iconHour = parseInt(firstHourly.time.split(':')[0], 10)
      const tod = getTimeOfDay(iconHour, undefined, sunsetHHMM)
      return `/illust/weather/${illustFile(pickIllustKey(firstHourly.skyCode, firstHourly.ptyCode), tod)}.svg`
    }
    if (!displayWeather) return undefined
    const tod = getTimeOfDay(hour, undefined, sunsetHHMM)
    return `/illust/weather/${illustFile(pickIllustKey(displayWeather.skyCode, displayWeather.ptyCode), tod)}.svg`
  }, [displayedHourly, displayWeather, hour, sunriseSunset?.sunset])

  const heroIconHour = displayedHourly[0] ? parseInt(displayedHourly[0].time.split(':')[0], 10) : hour
  const heroSunsetHm = sunsetHmNumber(sunriseSunset?.sunset)

  // ── Side-effect: OpenMeteo compare ───────────────────────────────────────
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

  // ── Side-effect: dust / pollen / sunrise / alerts ─────────────────────────
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

    fetch(`/api/alert?regCode=108`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => { if (!ac.signal.aborted && Array.isArray(d)) setAlerts(d) })
      .catch(() => { /* ignore */ })

    return () => { ac.abort() }
  }, [location])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSelectLocation(loc: LocationInfo) {
    setManualLocation(loc)
    saveRecentLocation(loc)
  }

  // ── Shared nodes ──────────────────────────────────────────────────────────
  const locationSearch = <LocationSearchBar onSelect={handleSelectLocation} />
  const recentChips = <RecentChips onSelect={handleSelectLocation} currentName={location.name} />
  const nearbyChips = (
    <NearbyWeatherChips
      currentLat={location.lat}
      currentLon={location.lon}
      currentName={location.name}
      onSelect={handleSelectLocation}
    />
  )

  const currentDongName = extractDongName(location.name, location.address)
  const normalizedLocationName = location.name?.trim()
  const currentPlaceName =
    normalizedLocationName && normalizedLocationName !== currentDongName ? normalizedLocationName : undefined

  // ── Weekly data ───────────────────────────────────────────────────────────
  const weeklyDisplayDaily = useMemo(
    () => mergeWeeklyDailyStartingTomorrow(weekly, weatherData?.hourly ?? [], todayYmdKst),
    [weekly, weatherData?.hourly, todayYmdKst],
  )
  const weeklyProps = {
    daily: weeklyDisplayDaily,
    hourly: weatherData?.hourly ?? [],
    loading: weeklyLoading && weeklyDisplayDaily.length === 0,
  } as const

  // ── Shared UI nodes ───────────────────────────────────────────────────────
  const hourlyStripTab1 = (
    <HourlyWeatherStrip
      hourly={displayedHourly}
      currentHour={hour}
      sunsetTime={sunriseSunset?.sunset}
    />
  )
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
      previousPeriodWeather={previousPeriodSummary}
      openMeteoCompare={openMeteoCompare}
      morningSummary={morningSummary}
      futureDaily={weeklyDisplayDaily.slice(0, 2)}
    />
  )

  // ── Time period picker (uses outfit location's weather) ────────────────────
  const timePeriodPicker = (
    <TimePeriodPicker
      currentHour={hour}
      currentConditions={
        outfitWeatherData?.current
          ? {
              temperature: outfitWeatherData.current.temperature,
              skyCode: outfitWeatherData.current.skyCode,
              ptyCode: outfitWeatherData.current.ptyCode,
            }
          : null
      }
      hourly={outfitWeatherData?.hourly ?? []}
      selectedRepHour={periodPreset.repHour}
      selectedDayOffset={periodPreset.dayOffset}
      sunsetTime={sunriseSunset?.sunset}
      onSelectPreset={handleSelectPreset}
    />
  )

  // ── Outfit panel (uses outfit location's weather) ─────────────────────────
  const outfitPanelProps = {
    weather: outfitDisplayWeather,
    hourly: outfitWeatherData?.hourly ?? [],
    daily: outfitMergedDaily,
    dust,
    alerts,
    terrain: outfitLocation.terrain ?? 'urban',
    outfitPeriodStartHour: presetChipPeriod.start,
    outfitIsNowPeriod,
    outfitCurrentKstHour: hour,
    outfitScheduleSyncKey,
    scheduleYmd,
    scheduleYmdMin: outfitForecastYmdBounds.min,
    scheduleYmdMax: outfitForecastYmdBounds.max,
    onScheduleYmdChange: setScheduleYmd,
    activityStartHourMin: outfitIsNowPeriod ? (hour + 1) % 24 : 0,
    onActivityHoursChange: (s: number, e: number) => setWxActivityHours({ start: s, end: e }),
    mobileInterestSchedule: tab2VisitSchedule,
    onMobileInterestScheduleChange: setTab2VisitSchedule,
  }
  const outfitPanel = <OutfitPanel {...outfitPanelProps} variant="default" />
  const outfitPanelMobile = <OutfitPanel {...outfitPanelProps} variant="mobileSheet" />

  // ── Mobile: Tab headers ───────────────────────────────────────────────────

  // Tab 1 header: full search + GPS + chips
  const tab1Header = (
    <div className="px-3 pt-3 pb-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1 min-w-0">{locationSearch}</div>
        <button
          onClick={() => requestGps()}
          disabled={gpsLoading}
          className="flex items-center justify-center transition-all active:opacity-80 flex-shrink-0"
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            fontSize: 20,
            color: gpsLoading ? 'var(--muted)' : 'var(--humidity)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
          aria-label="내 위치로 설정"
        >
          {gpsLoading ? '⟳' : '📍'}
        </button>
      </div>
      {gpsError && <p className="text-xs mt-1 px-1" style={{ color: 'var(--danger)' }}>{gpsError}</p>}
      <div className="mt-2">{recentChips}{nearbyChips}</div>
    </div>
  )

  // Tab 2 header: 제목만 (지역 검색은 카드 안 한 곳에서만)
  const tab2Header = (
    <div className="px-3 pt-2 pb-2">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold" style={{ color: tab2Location ? 'var(--primary)' : 'var(--muted)' }}>
          {tab2Location ? '📌' : '📍'}
        </span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>관심지역</span>
        <span className="text-xs truncate flex-1" style={{ color: 'var(--muted)' }}>
          {tab2Location ? `— ${tab2Location.name}` : '— 현재 위치 기준'}
        </span>
      </div>
    </div>
  )

  // Tab 3: 날씨 소스만 선택 (직접 설정·일정 적용 버튼 없음 — 관심 일정은 관심지역 탭에서 관리)
  const tab3Header = (
    <div className="px-3 pt-2 pb-2 space-y-2">
      <LocationSourcePicker
        options={[
          { key: 'tab1', label: '현재 위치', sublabel: location.name },
          { key: 'tab2', label: '관심지역', sublabel: tab2Location?.name ?? '미설정', available: !!tab2Location },
        ]}
        selected={tab3Source}
        onChange={key => setTab3Source(key as Tab3Source)}
      />
      <div className="px-2 py-1 rounded-md" style={{ background: 'var(--primary-tint-08)' }}>
        <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
          📍 {outfitLocation.name}
          {outfitLocation.address ? ` · ${outfitLocation.address}` : ''}
        </p>
      </div>
    </div>
  )

  // Tab 4: 공통 — 모바일 헤더·PC 초단기 블록에서 재사용
  const tab4SourcePicker = (
    <LocationSourcePicker
      options={[
        { key: 'tab1', label: '현재 위치', sublabel: location.name },
        { key: 'tab2', label: '관심지역', sublabel: tab2Location?.name ?? '미설정', available: !!tab2Location },
      ]}
      selected={tab4Source}
      onChange={key => setTab4Source(key as Tab4Source)}
    />
  )
  const tab4AnchorSummary = (
    <div className="px-2 py-1 rounded-md" style={{ background: 'var(--primary-tint-08)' }}>
      <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
        📍 {spotLocation.name}
        {spotLocation.address ? ` · ${spotLocation.address}` : ''}
      </p>
    </div>
  )

  const tab4Header = (
    <div className="px-3 pt-2 pb-2 space-y-2">
      {tab4SourcePicker}
      {tab4AnchorSummary}
    </div>
  )

  // PC: 통합 지역 검색 + 접이식 초단기(모바일 4번째 탭과 동일)
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
        {nearbyChips}
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
        {desktopUltraShortOpen ? (
          <div className="px-3 pb-3 pt-1 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              모바일 「단기 예측」 탭과 같은 내용입니다. 상단 검색으로 고른 <strong style={{ color: 'var(--text)' }}>현재 위치</strong>를 기준으로 외출·관심지역 등을 아래에서 골라 초단기 산악·낙뢰·강수 정보를 봅니다.
            </p>
            {tab4SourcePicker}
            {tab4AnchorSummary}
            <SpotPanel compact anchorLocation={spotLocation} showLocationSearch={false} />
          </div>
        ) : null}
      </div>
    </div>
  )

  // ── Tab 2 content ─────────────────────────────────────────────────────────
  const tab2Content = (
    <>
      {/* Fallback notice */}
      {tab2IsFallback && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'var(--primary-tint-07)', border: '1px dashed var(--border)' }}
        >
          <span className="text-sm flex-shrink-0 mt-0.5">💡</span>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            관심지역이 설정되지 않아 <strong style={{ color: 'var(--text)' }}>현재 위치({location.name})</strong> 기준으로 표시됩니다.
            위의 검색창에서 지역을 고정하면 독립적으로 관리됩니다.
          </p>
        </div>
      )}
      <InterestLocationCard
        weather={tab2EffectiveWeather?.current ?? null}
        hourly={tab2HourlyDisplay}
        daily={tab2WeeklyDisplay}
        alerts={tab2Alerts}
        location={tab2EffectiveLocation}
        currentHour={hour}
        loading={(tab2Location ? tab2WeatherLoading : weatherLoading) && !tab2EffectiveWeather}
        schedule={tab2VisitSchedule ?? defaultVisitSchedule(hour)}
        onScheduleChange={setTab2VisitSchedule}
        pinnedLocation={tab2Location}
        onLocationSelect={handleSaveTab2Location}
      />
    </>
  )

  // ── Tab 3 content ─────────────────────────────────────────────────────────
  const tab3OutfitLoading = tab3Source === 'tab2' ? tab2WeatherLoading : weatherLoading
  const tab3Content = (
    <>
      {tab3OutfitLoading && !outfitWeatherData && (
        <div className="h-8 animate-pulse rounded-lg" style={{ background: 'var(--colors-surface-soft)' }} />
      )}
      {outfitPanelMobile}
    </>
  )

  // ── Summary line (legacy desktop) ────────────────────────────────────────
  const locationSummaryLine =
    location.address?.trim() || location.name?.trim() || '위치를 검색하거나 GPS로 설정해 주세요'

  return (
    <>
      {/* ── Mobile (< lg) ── */}
      <div className="lg:hidden">
        <MobileLayout
          tabs={[
            {
              key: 'current',
              icon: '🌤',
              label: '날씨 / 위치',
              header: tab1Header,
              content: (
                <>
                  {weatherCard}
                  {hourlyStripTab1}
                  {highlightsGrid}
                  <WeeklyForecastInline key="weekly-inline-mobile" {...weeklyProps} />
                </>
              ),
            },
            {
              key: 'interest',
              icon: '📌',
              label: '관심지역',
              header: tab2Header,
              content: tab2Content,
            },
            {
              key: 'outfit',
              icon: '👔',
              label: '외출옷 추천',
              header: tab3Header,
              content: tab3Content,
            },
            {
              key: 'spot',
              icon: '⛳',
              label: '단기 예측',
              header: tab4Header,
              content: <SpotPanel anchorLocation={spotLocation} />,
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
              {timePeriodPicker}
              {weatherCard}
              {highlightsGrid}
            </>
          }
          right={
            <>
              {hourlyStripDesktop}
              <WeeklyForecastInline key="weekly-inline-desktop" {...weeklyProps} />
              {outfitPanel}
            </>
          }
        />
      </div>

      {/* Legacy location summary (hidden, keeps desktop shell happy) */}
      <div className="hidden" aria-hidden>
        <span>{locationSummaryLine}</span>
      </div>
    </>
  )
}

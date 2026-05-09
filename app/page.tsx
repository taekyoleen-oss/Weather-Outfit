'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { LocationSearchBar } from '@/components/weather/LocationSearchBar'
import { GpsButton } from '@/components/weather/GpsButton'
import { RecentChips, saveRecentLocation } from '@/components/weather/RecentChips'
import { WeatherCard } from '@/components/weather/WeatherCard'
import { HourlyWeatherStrip } from '@/components/weather/HourlyWeatherStrip'
import { UltraSrtFcstCard } from '@/components/weather/UltraSrtFcstCard'
import { TempGraph48h } from '@/components/weather/TempGraph48h'
import dynamic from 'next/dynamic'
const WeeklyForecastInline = dynamic(
  () => import('@/components/weather/WeeklyForecastInline').then((m) => m.WeeklyForecastInline),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-lg" style={{ background: 'var(--colors-surface-soft)' }} /> }
)
import { HighlightsGrid } from '@/components/weather/HighlightsGrid'
import { TimePeriodPicker } from '@/components/weather/TimePeriodPicker'
import { OutfitPanel } from '@/components/outfit/OutfitPanel'
import { SpotPanel } from '@/components/spot/SpotPanel'
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
} from '@/lib/utils/timeOfDay'
import { useNowMinute } from '@/lib/hooks/useNowMinute'
import { feelsLike, weatherLabel, weatherEmojiFromLabel, pickIllustKey, illustFile } from '@/lib/utils/formatWeather'
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
import { mergeWeeklyDailyStartingTomorrow } from '@/lib/weather/weeklyFromTomorrow'
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

  // ── Spot data (page-level fetch for suitability bars + precip/lightning) ──
  const [spotData, setSpotData] = useState<SpotData | null>(null)

  // ── Desktop: expandable spot section ─────────────────────────────────────
  const [desktopUltraShortOpen, setDesktopUltraShortOpen] = useState(false)

  // ── Time / period state (for outfit panel) ────────────────────────────────
  const [periodPreset, setPeriodPreset] = useState(() => ({
    repHour: TIME_PERIODS[getPeriodIndex(hour)].repHour,
    dayOffset: 0,
  }))
  /** 연속 시간대 범위 선택 시 끝 칩 정보. 단일 선택이면 null */
  const [periodPresetEnd, setPeriodPresetEnd] = useState<{ repHour: number; dayOffset: number } | null>(null)
  const [scheduleYmd, setScheduleYmd] = useState(() => kstTodayYmd())
  const [wxActivityHours, setWxActivityHours] = useState<{ start: number; end: number } | null>(null)

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

  // ── Reset outfit period on location change ────────────────────────────────
  useEffect(() => {
    setPeriodPreset({ repHour: TIME_PERIODS[getPeriodIndex(hour)].repHour, dayOffset: 0 })
    setScheduleYmd(kstTodayYmd())
    setWxActivityHours(null)
  }, [location]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (weatherData) {
      setPeriodPreset({ repHour: TIME_PERIODS[getPeriodIndex(hour)].repHour, dayOffset: 0 })
      setScheduleYmd(kstTodayYmd())
      setWxActivityHours(null)
    }
  }, [weatherData]) // eslint-disable-line react-hooks/exhaustive-deps

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
  function handleSelectLocation(loc: LocationInfo) {
    setManualLocation(loc)
    saveRecentLocation(loc)
  }

  function handleSelectPreset(repHour: number, dayOffset: number) {
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

  // ── Display weather ───────────────────────────────────────────────────────
  const displayWeather = useMemo(
    () => computeDisplayWeather(weatherData, hour, periodPreset, scheduleYmd, activityBand, todayYmdKst),
    [weatherData, hour, periodPreset, scheduleYmd, activityBand, todayYmdKst],
  )

  // ── Displayed hourly: desktop/outfit period-adjusted ─────────────────────
  const displayedHourly = useMemo(
    () => computeDisplayedHourly(
      weatherData?.hourly ?? [], hour, activityStartHour, scheduleYmd, selectedCalendarDayOffset, todayYmdKst,
    ),
    [weatherData, hour, activityStartHour, scheduleYmd, selectedCalendarDayOffset, todayYmdKst],
  )

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
      selectedScheduleYmd={scheduleYmd}
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
    scheduleYmd,
    scheduleYmdMin: outfitForecastYmdBounds.min,
    scheduleYmdMax: outfitForecastYmdBounds.max,
    onScheduleYmdChange: handleScheduleYmdChange,
    activityStartHourMin: outfitIsNowPeriod ? (hour + 1) % 24 : 0,
    onActivityHoursChange: (s: number, e: number) => setWxActivityHours({ start: s, end: e }),
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
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        📍 {location.name} 날씨 기준
      </p>
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
          strip10m={spotData.strip10m}
          lightningNow={spotData.lightningNow}
        />
      )}
      <TempGraph48h hourly={weatherData?.hourly ?? []} loading={weatherLoading && !weatherData} />
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
      {highlightsGrid}
      <WeeklyForecastInline key="weekly-inline-mobile" {...weeklyProps} />

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

      {/* Weather alerts */}
      {combinedAlerts.length > 0 && (
        <div className="glass-card p-3">
          <h3 className="text-base font-semibold mb-2.5" style={{ color: 'var(--danger)' }}>
            기상특보
          </h3>
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
        </div>
      )}
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
          onTabChange={setMobileLayoutTab}
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

      <div className="hidden" aria-hidden>
        <span>{locationSummaryLine}</span>
      </div>
    </>
  )
}

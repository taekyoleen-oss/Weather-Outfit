'use client'

import { useEffect, useState, useMemo } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { LocationSearchBar } from '@/components/weather/LocationSearchBar'
import { GpsButton } from '@/components/weather/GpsButton'
import { RecentChips, saveRecentLocation } from '@/components/weather/RecentChips'
import { WeatherCard } from '@/components/weather/WeatherCard'
import { HourlyWeatherStrip } from '@/components/weather/HourlyWeatherStrip'
import dynamic from 'next/dynamic'
const WeeklyForecastInline = dynamic(
  () => import('@/components/weather/WeeklyForecastInline').then((m) => m.WeeklyForecastInline),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-2xl" style={{ background: 'var(--border)' }} /> }
)
import { HighlightsGrid } from '@/components/weather/HighlightsGrid'
import { TimePeriodPicker } from '@/components/weather/TimePeriodPicker'
import { OutfitPanel } from '@/components/outfit/OutfitPanel'
import { NearbyWeatherChips } from '@/components/weather/NearbyWeatherChips'
import { SpotPanel } from '@/components/spot/SpotPanel'
import { useAutoLocation } from '@/lib/hooks/useAutoLocation'
import { useWeather } from '@/lib/hooks/useWeather'
import { useWeeklyForecast } from '@/lib/hooks/useWeeklyForecast'
import { getTimeOfDay, kstTodayYmd, diffCalendarDaysYmd, addCalendarDaysFromKstYmd } from '@/lib/utils/timeOfDay'
import { useNowMinute } from '@/lib/hooks/useNowMinute'
import { feelsLike, weatherLabel, weatherEmojiFromLabel, pickIllustKey, illustFile } from '@/lib/utils/formatWeather'
import {
  TIME_PERIODS,
  getPeriodIndex,
  getPreviousCompletedPeriod,
  samePeriodHourlySliceFloor,
  orderHourlyStripBeforeNoon,
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
  // 동/읍/면/리/가 단위가 없으면 표기하지 않음 (예: "서울" 단독)
  return undefined
}

export default function HomePage() {
  const { location, gpsLoading, gpsError, requestGps, setManualLocation } = useAutoLocation()
  const { data: weatherData, loading: weatherLoading } = useWeather(location)
  const { data: weekly, loading: weeklyLoading } = useWeeklyForecast(location)

  const [dust, setDust] = useState<DustData | null>(null)
  const [pollen, setPollen] = useState<PollenData | null>(null)
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunset | null>(null)
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [openMeteoCompare, setOpenMeteoCompare] = useState<OpenMeteoDailyCompare | null>(null)

  const hour = useNowMinute()

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

  /** 오늘(KST) 기준 달력 일수 오프셋 — 스트립 보조 */
  const selectedCalendarDayOffset = useMemo(
    () => diffCalendarDaysYmd(todayYmdKst, scheduleYmd),
    [todayYmdKst, scheduleYmd],
  )

  const forecastYmdBounds = useMemo(() => {
    const slotYmds = buildHourlySlotYmds(weatherData?.hourly ?? [])
    if (!slotYmds.length) return { min: todayYmdKst, max: todayYmdKst }
    const uniq = [...new Set(slotYmds)].sort()
    return { min: uniq[0]!, max: uniq[uniq.length - 1]! }
  }, [weatherData?.hourly, todayYmdKst])

  // 앱 시작 시 자동 위치 갱신: 저장 위치가 오래됐거나 실제 이동이 큰 경우에만 조용히 갱신
  useEffect(() => {
    requestGps({ reason: 'auto', silent: true })
  }, [requestGps])

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

  const period = getTimeOfDay(activityStartHour, sunriseSunset?.sunrise, sunriseSunset?.sunset)

  // Weather to display — 활동 기준일·시작 시각 구간의 대표 슬롯(지금 칩은 현재 시각 슬롯)
  const displayWeather = useMemo((): CurrentWeather | null => {
    const base = weatherData?.current ?? null
    const hourly = weatherData?.hourly ?? []
    if (!base) return null
    const today = todayYmdKst

    const isPickerNowSlot =
      periodPreset.dayOffset === 0 &&
      getPeriodIndex(periodPreset.repHour) === getPeriodIndex(hour) &&
      scheduleYmd === today

    if (isPickerNowSlot) {
      const hourStr = String(hour).padStart(2, '0') + ':00'
      const entry = hourly.find((h) => h.time === hourStr) ?? null
      return entry ? hourlyToCurrentWeather(entry, base) : base
    }

    const { entry } = resolveHourlyForYmdBand(hourly, scheduleYmd, activityBand, today)
    if (entry) {
      return hourlyToCurrentWeather(entry, { ...base, basisDateKst: scheduleYmd })
    }
    return base
  }, [weatherData, hour, periodPreset, scheduleYmd, activityBand, todayYmdKst])

  const outfitScheduleSyncKey = `${periodPreset.repHour}|${periodPreset.dayOffset}`

  /** 가장 최근에 끝난 시간대의 대표 기온·체감(시간별 예보 슬롯 기준) */
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
      entry = candidates.length ? candidates[candidates.length - 1] : null
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

  // Filter hourly data: KST; 오후 전엔 오전(6~13시) 전체가 먼저 보이도록 정렬
  const displayedHourly = useMemo((): HourlyForecast[] => {
    const hourly = weatherData?.hourly ?? []
    if (!hourly.length) return hourly

    const toHourNum = (t: string) => parseInt(t.split(':')[0], 10)
    const todayYmd = kstTodayYmd()

    /**
     * 오전(hour < 13)일 때: 오늘 날짜 데이터 중 minHour 이상인 첫 슬롯부터 반환.
     * fcstDate 필드가 없는 레거시 슬롯은 오늘 것으로 간주.
     * 오늘 데이터에서 찾지 못하면 전체 리스트 기반으로 폴백.
     */
    function sliceFromHourOnSameDay(list: HourlyForecast[], minHour: number): HourlyForecast[] {
      if (hour < 12) {
        // 오늘 날짜 슬롯만 먼저 탐색 → 오전 데이터가 반드시 오늘 것임을 보장
        const todayIdx = list.findIndex(
          (h) => (h.fcstDate === todayYmd || !h.fcstDate) && toHourNum(h.time) >= minHour
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
      const dayOff = diffCalendarDaysYmd(todayYmd, scheduleYmd)
      const isTomorrow = dayOff > 0 || selIdx < curIdx

      if (selIdx === curIdx && dayOff === 0) {
        out = sliceFromHourOnSameDay(hourly, samePeriodHourlySliceFloor(hour, curIdx))
      } else if (!isTomorrow) {
        const preNoonFloor = hour < 12 ? TIME_PERIODS[1].start : -1
        const startFloor = Math.max(sliceStartHour, hour, preNoonFloor)
        out = sliceFromHourOnSameDay(hourly, startFloor)
      } else {
        usedTomorrowPath = true
        const targetYmd = scheduleYmd
        const dateAwareIdx = hourly.findIndex(
          (h) => h.fcstDate === targetYmd && toHourNum(h.time) >= sliceStartHour,
        )
        if (dateAwareIdx >= 0) {
          out = hourly.slice(dateAwareIdx)
        } else {
          const midnightIdx = hourly.findIndex((h, i) =>
            i > 0 && toHourNum(h.time) < toHourNum(hourly[i - 1].time),
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
  }, [weatherData, activityStartHour, scheduleYmd, selectedCalendarDayOffset, hour])

  /** 오전(6–11시) 날씨 요약 — 오후(12시 이후)에만 계산 */
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

  useEffect(() => {
    if (!location) return
    const ac = new AbortController()
    setOpenMeteoCompare(null)
    fetch(`/api/weather/compare?lat=${location.lat}&lon=${location.lon}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d: OpenMeteoDailyCompare & { error?: string }) => {
        if (ac.signal.aborted || d?.error) return
        if (
          d &&
          typeof d.todayMin === 'number' &&
          typeof d.todayMax === 'number' &&
          !Number.isNaN(d.todayMin) &&
          !Number.isNaN(d.todayMax)
        ) {
          setOpenMeteoCompare({
            yesterdaySameHourTemp:
              typeof d.yesterdaySameHourTemp === 'number' && !Number.isNaN(d.yesterdaySameHourTemp)
                ? d.yesterdaySameHourTemp
                : null,
            todayMin: d.todayMin,
            todayMax: d.todayMax,
          })
        }
      })
      .catch((e) => { if ((e as Error).name !== 'AbortError') {} })
    return () => { ac.abort() }
  }, [location])

  useEffect(() => {
    if (!location) return
    const { nx, ny, lat, lon } = location
    const ac = new AbortController()

    fetch(`/api/dust?nx=${nx}&ny=${ny}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => { if (!ac.signal.aborted && !d.error) setDust(d) })
      .catch((e) => { if ((e as Error).name !== 'AbortError') {} })

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
      .catch((e) => { if ((e as Error).name !== 'AbortError') {} })

    fetch(`/api/alert?regCode=108`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => { if (!ac.signal.aborted && Array.isArray(d)) setAlerts(d) })
      .catch((e) => { if ((e as Error).name !== 'AbortError') {} })

    return () => { ac.abort() }
  }, [location])

  function handleSelectLocation(loc: LocationInfo) {
    setManualLocation(loc)
    saveRecentLocation(loc)
  }

  // ── Shared nodes ────────────────────────────────────
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
      selectedDayOffset={periodPreset.dayOffset}
      sunsetTime={sunriseSunset?.sunset}
      onSelectPreset={handleSelectPreset}
    />
  )

  const currentDongName = extractDongName(location.name, location.address)
  const normalizedLocationName = location.name?.trim()
  const currentPlaceName =
    normalizedLocationName && normalizedLocationName !== currentDongName ? normalizedLocationName : undefined
  const hourlyStrip = (
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
  const hourlyStripMobile = (
    <HourlyWeatherStrip
      hourly={displayedHourly}
      currentHour={hour}
      sunsetTime={sunriseSunset?.sunset}
    />
  )
  const highlightsGrid = (
    <HighlightsGrid
      weather={displayWeather}
      dust={dust}
      pollen={pollen}
      loading={weatherLoading}
      compact
    />
  )
  const weeklyDisplayDaily = useMemo(
    () => mergeWeeklyDailyStartingTomorrow(weekly, weatherData?.hourly ?? [], todayYmdKst),
    [weekly, weatherData?.hourly, todayYmdKst],
  )
  const weeklyProps = {
    daily: weeklyDisplayDaily,
    hourly: weatherData?.hourly ?? [],
    loading: weeklyLoading && weeklyDisplayDaily.length === 0,
  } as const
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
  const outfitPanelProps = {
    weather: displayWeather,
    hourly: weatherData?.hourly ?? [],
    dust,
    alerts,
    terrain: location.terrain ?? 'urban',
    outfitPeriodStartHour: presetChipPeriod.start,
    outfitIsNowPeriod,
    outfitCurrentKstHour: hour,
    outfitScheduleSyncKey,
    scheduleYmd,
    scheduleYmdMin: forecastYmdBounds.min,
    scheduleYmdMax: forecastYmdBounds.max,
    onScheduleYmdChange: setScheduleYmd,
    activityStartHourMin: outfitIsNowPeriod ? (hour + 1) % 24 : 0,
    onActivityHoursChange: (s: number, e: number) => setWxActivityHours({ start: s, end: e }),
  }

  const outfitPanel = <OutfitPanel {...outfitPanelProps} variant="default" />
  const outfitPanelMobile = <OutfitPanel {...outfitPanelProps} variant="mobileSheet" />

  const locationSummaryLine =
    location.address?.trim() ||
    location.name?.trim() ||
    '위치를 검색하거나 GPS로 설정해 주세요'

  return (
    <>
      {/* ── Mobile (< lg) ── */}
      <div className="lg:hidden">
        <MobileLayout
          locationSearch={locationSearch}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          onGps={requestGps}
          locationSummaryLine={locationSummaryLine}
          recentChips={<>{recentChips}{nearbyChips}</>}
          currentContent={weatherCard}
          weatherContent={
            <>
              {hourlyStripMobile}
              {highlightsGrid}
              <WeeklyForecastInline key="weekly-inline-mobile" {...weeklyProps} />
            </>
          }
          outfitContent={
            <>
              {timePeriodPicker}
              {outfitPanelMobile}
            </>
          }
          spotContent={<SpotPanel anchorLocation={location} />}
        />
      </div>

      {/* ── Desktop (≥ lg) ── */}
      <div className="hidden lg:block">
        <DashboardShell
          left={
            <>
              {locationSearch}
              <div className="flex items-center gap-2">
                <GpsButton loading={gpsLoading} error={gpsError} onClick={requestGps} />
                {currentDongName && (
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      color: 'var(--muted)',
                      background: 'rgba(255,255,255,0.75)',
                      border: '1px solid var(--border)',
                    }}
                    title={`현재 조회 위치: ${currentDongName}`}
                  >
                    {currentDongName}
                  </span>
                )}
                {currentPlaceName && (
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      color: 'var(--humidity)',
                      background: 'rgba(91,141,238,0.12)',
                      border: '1px solid var(--border)',
                    }}
                    title={`조회 장소: ${currentPlaceName}`}
                  >
                    {currentPlaceName}
                  </span>
                )}
              </div>
              {recentChips}
              {nearbyChips}
              {timePeriodPicker}
              {weatherCard}
              {highlightsGrid}
              {/* 좌측 컬럼 하단: 시설(골프장) 초단기 날씨 — PC에서도 노출 */}
              <SpotPanel compact anchorLocation={location} />
            </>
          }
          right={
            <>
              {hourlyStrip}
              <WeeklyForecastInline key="weekly-inline-desktop" {...weeklyProps} />
              {outfitPanel}
            </>
          }
        />
      </div>
    </>
  )
}

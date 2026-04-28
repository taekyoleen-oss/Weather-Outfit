'use client'

import { useEffect, useState, useMemo } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { LocationSearchBar } from '@/components/weather/LocationSearchBar'
import { GpsButton } from '@/components/weather/GpsButton'
import { RecentChips, saveRecentLocation } from '@/components/weather/RecentChips'
import { WeatherCard } from '@/components/weather/WeatherCard'
import { HourlyWeatherStrip } from '@/components/weather/HourlyWeatherStrip'
import { WeeklyForecastInline } from '@/components/weather/WeeklyForecastInline'
import { HighlightsGrid } from '@/components/weather/HighlightsGrid'
import { TimePeriodPicker } from '@/components/weather/TimePeriodPicker'
import { OutfitPanel } from '@/components/outfit/OutfitPanel'
import { NearbyWeatherChips } from '@/components/weather/NearbyWeatherChips'
import { useAutoLocation } from '@/lib/hooks/useAutoLocation'
import { useWeather } from '@/lib/hooks/useWeather'
import { useWeeklyForecast } from '@/lib/hooks/useWeeklyForecast'
import { getTimeOfDay, currentHourKst, kstTodayYmd } from '@/lib/utils/timeOfDay'
import { feelsLike, weatherLabel, weatherEmojiFromLabel } from '@/lib/utils/formatWeather'
import {
  TIME_PERIODS,
  getPeriodIndex,
  getPreviousCompletedPeriod,
  samePeriodHourlySliceFloor,
  orderHourlyStripBeforeNoon,
} from '@/lib/utils/timePeriods'
import type {
  DustData,
  SunriseSunset,
  WeatherAlert,
  CurrentWeather,
  HourlyForecast,
  PreviousPeriodWeatherSummary,
  MorningSummary,
} from '@/types/weather'
import type { LocationInfo } from '@/types/location'
import type { OpenMeteoDailyCompare } from '@/lib/weather/openMeteoCompare'

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
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunset | null>(null)
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [openMeteoCompare, setOpenMeteoCompare] = useState<OpenMeteoDailyCompare | null>(null)

  const hour = currentHourKst()

  // Selected time period (repHour + dayOffset of the chosen period)
  const [selectedPeriodSelection, setSelectedPeriodSelection] = useState<{ repHour: number; dayOffset: number }>(
    () => ({ repHour: TIME_PERIODS[getPeriodIndex(currentHourKst())].repHour, dayOffset: 0 })
  )
  const selectedPeriodHour = selectedPeriodSelection.repHour

  // Reset selected period to current when location changes
  useEffect(() => {
    setSelectedPeriodSelection({ repHour: TIME_PERIODS[getPeriodIndex(currentHourKst())].repHour, dayOffset: 0 })
  }, [location])

  // When new weather arrives, keep selected period in sync with current time
  useEffect(() => {
    if (weatherData) {
      setSelectedPeriodSelection({ repHour: TIME_PERIODS[getPeriodIndex(currentHourKst())].repHour, dayOffset: 0 })
    }
  }, [weatherData])

  const period = getTimeOfDay(selectedPeriodHour, sunriseSunset?.sunrise, sunriseSunset?.sunset)

  // Weather to display based on selected period
  const displayWeather = useMemo((): CurrentWeather | null => {
    const base = weatherData?.current ?? null
    if (!base) return null
    const currentPeriodIdx = getPeriodIndex(hour)
    const selectedPeriodIdx = getPeriodIndex(selectedPeriodHour)
    // 지금 시간대: 카드 기온·체감 등을 현재 KST '시' 정각 슬롯(예 11:02 → 11시)과 맞춤
    if (selectedPeriodSelection.dayOffset === 0 && selectedPeriodIdx === currentPeriodIdx) {
      const hourStr = String(hour).padStart(2, '0') + ':00'
      const entry = weatherData?.hourly.find((h) => h.time === hourStr) ?? null
      return entry ? hourlyToCurrentWeather(entry, base) : base
    }
    const repHourStr = String(selectedPeriodHour).padStart(2, '0') + ':00'
    const today = kstTodayYmd()
    const targetMs =
      Date.UTC(
        parseInt(today.slice(0, 4), 10),
        parseInt(today.slice(4, 6), 10) - 1,
        parseInt(today.slice(6, 8), 10)
      ) +
      selectedPeriodSelection.dayOffset * 86400000
    const d = new Date(targetMs)
    const targetYmd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
    const entry =
      weatherData?.hourly.find((h) => h.time === repHourStr && h.fcstDate === targetYmd) ??
      (selectedPeriodSelection.dayOffset === 0
        ? weatherData?.hourly.find((h) => h.time === repHourStr) ?? null
        : null)
    return entry ? hourlyToCurrentWeather(entry, base) : base
  }, [weatherData, selectedPeriodHour, selectedPeriodSelection.dayOffset, hour])

  // Highlight range for HourlyWeatherStrip
  const selectedPeriod = TIME_PERIODS.find((p) => p.repHour === selectedPeriodHour)

  const curPeriodIdx = getPeriodIndex(hour)

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

    if (!selectedPeriod) {
      out = sliceFromHourOnSameDay(hourly, samePeriodHourlySliceFloor(hour, curPeriodIdx))
    } else {
      const selIdx = getPeriodIndex(selectedPeriodHour)
      const curIdx = getPeriodIndex(hour)
      const isTomorrow = selectedPeriodSelection.dayOffset > 0 || selIdx < curIdx

      if (selIdx === curIdx && selectedPeriodSelection.dayOffset === 0) {
        // 오전이고 오전 시간대가 선택된 경우: 오전 시작(6시)부터 표시
        out = sliceFromHourOnSameDay(hourly, samePeriodHourlySliceFloor(hour, curIdx))
      } else if (!isTomorrow) {
        const preNoonFloor = hour < 12 ? TIME_PERIODS[1].start : -1
        const startFloor = Math.max(selectedPeriod.start, hour, preNoonFloor)
        out = sliceFromHourOnSameDay(hourly, startFloor)
      } else {
        usedTomorrowPath = true
        const today = kstTodayYmd()
        const targetMs =
          Date.UTC(
            parseInt(today.slice(0, 4), 10),
            parseInt(today.slice(4, 6), 10) - 1,
            parseInt(today.slice(6, 8), 10)
          ) +
          selectedPeriodSelection.dayOffset * 86400000
        const d = new Date(targetMs)
        const targetYmd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
        const dateAwareIdx = hourly.findIndex(
          (h) => h.fcstDate === targetYmd && toHourNum(h.time) >= selectedPeriod.start
        )
        if (dateAwareIdx >= 0) {
          out = hourly.slice(dateAwareIdx)
        } else {
          const midnightIdx = hourly.findIndex((h, i) =>
            i > 0 && toHourNum(h.time) < toHourNum(hourly[i - 1].time)
          )
          if (midnightIdx < 0) {
            out = sliceFromHourOnSameDay(hourly, hour)
          } else {
            const afterMidnight = hourly.slice(midnightIdx)
            const startIdx = afterMidnight.findIndex((h) => toHourNum(h.time) >= selectedPeriod.start)
            out = startIdx >= 0 ? afterMidnight.slice(startIdx) : afterMidnight
          }
        }
      }
    }

    if (hour < 12 && !usedTomorrowPath) {
      out = orderHourlyStripBeforeNoon(out, hour)
    }
    return out
  }, [weatherData, selectedPeriod, selectedPeriodHour, selectedPeriodSelection.dayOffset, hour, curPeriodIdx])

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

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setOpenMeteoCompare(null)
    fetch(`/api/weather/compare?lat=${location.lat}&lon=${location.lon}`)
      .then((r) => r.json())
      .then((d: OpenMeteoDailyCompare & { error?: string }) => {
        if (cancelled || d?.error) return
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
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [location])

  useEffect(() => {
    if (!location) return
    const { nx, ny, lat, lon } = location

    fetch(`/api/dust?nx=${nx}&ny=${ny}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setDust(d) })
      .catch(() => {})

    fetch(`/api/sunrise?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((d) => { if (d.sunrise) setSunriseSunset(d) })
      .catch(() => {})

    fetch(`/api/alert?regCode=108`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setAlerts(d) })
      .catch(() => {})
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
      hourly={weatherData?.hourly ?? []}
      selectedRepHour={selectedPeriodHour}
      selectedDayOffset={selectedPeriodSelection.dayOffset}
      onSelect={(repHour, dayOffset) => setSelectedPeriodSelection({ repHour, dayOffset })}
    />
  )

  const weatherCard = (
    <WeatherCard
      weather={displayWeather}
      period={period}
      loading={weatherLoading}
      addressLine={location.address}
      sunriseSunset={sunriseSunset}
      uvDisplay={uvForCard}
      dust={dust}
      previousPeriodWeather={previousPeriodSummary}
      openMeteoCompare={openMeteoCompare}
      morningSummary={morningSummary}
    />
  )
  const currentDongName = extractDongName(location.name, location.address)
  const hourlyStrip = (
    <HourlyWeatherStrip
      hourly={displayedHourly}
      currentHour={hour}
      selectedPeriodStart={selectedPeriod?.start}
      selectedPeriodEnd={selectedPeriod?.end}
      selectedDayOffset={selectedPeriodSelection.dayOffset}
    />
  )
  const highlightsGrid = (
    <HighlightsGrid
      weather={displayWeather}
      dust={dust}
      alerts={alerts}
      loading={weatherLoading}
      compact
    />
  )
  const weeklyProps = {
    daily: weekly,
    hourly: weatherData?.hourly ?? [],
    loading: weeklyLoading,
  } as const
  const outfitPanel = (
    <OutfitPanel
      weather={displayWeather}
      dust={dust}
      terrain={location.terrain ?? 'urban'}
      hour={selectedPeriodHour}
    />
  )

  return (
    <>
      {/* ── Mobile (< lg) ── */}
      <div className="lg:hidden">
        <MobileLayout
          locationSearch={locationSearch}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          onGps={requestGps}
          currentDongName={currentDongName}
          recentChips={<>{recentChips}{nearbyChips}</>}
          periodPicker={timePeriodPicker}
          weatherContent={
            <>
              {weatherCard}
              {hourlyStrip}
              {highlightsGrid}
              <WeeklyForecastInline key="weekly-inline-mobile" {...weeklyProps} />
            </>
          }
          outfitContent={outfitPanel}
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
              </div>
              {recentChips}
              {nearbyChips}
              {timePeriodPicker}
              {weatherCard}
              {highlightsGrid}
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

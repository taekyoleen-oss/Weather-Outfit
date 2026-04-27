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
import { getTimeOfDay, currentHour } from '@/lib/utils/timeOfDay'
import { feelsLike } from '@/lib/utils/formatWeather'
import { TIME_PERIODS, getPeriodIndex } from '@/lib/utils/timePeriods'
import type { DustData, SunriseSunset, WeatherAlert, CurrentWeather, HourlyForecast } from '@/types/weather'
import type { LocationInfo } from '@/types/location'

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
  }
}

export default function HomePage() {
  const { location, gpsLoading, gpsError, requestGps, setManualLocation } = useAutoLocation()
  const { data: weatherData, loading: weatherLoading } = useWeather(location)
  const { data: weekly, loading: weeklyLoading } = useWeeklyForecast(location)

  const [dust, setDust] = useState<DustData | null>(null)
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunset | null>(null)
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])

  const hour = currentHour()

  // Selected time period (repHour of the chosen period)
  const [selectedPeriodHour, setSelectedPeriodHour] = useState<number>(
    () => TIME_PERIODS[getPeriodIndex(new Date().getHours())].repHour
  )

  // Reset selected period to current when location changes
  useEffect(() => {
    setSelectedPeriodHour(TIME_PERIODS[getPeriodIndex(new Date().getHours())].repHour)
  }, [location])

  // When new weather arrives, keep selected period in sync with current time
  useEffect(() => {
    if (weatherData) {
      setSelectedPeriodHour(TIME_PERIODS[getPeriodIndex(new Date().getHours())].repHour)
    }
  }, [weatherData])

  const period = getTimeOfDay(selectedPeriodHour, sunriseSunset?.sunrise, sunriseSunset?.sunset)

  // Weather to display based on selected period
  const displayWeather = useMemo((): CurrentWeather | null => {
    const base = weatherData?.current ?? null
    if (!base) return null
    const currentPeriodIdx = getPeriodIndex(hour)
    const selectedPeriodIdx = getPeriodIndex(selectedPeriodHour)
    if (selectedPeriodIdx === currentPeriodIdx) return base
    const repHourStr = String(selectedPeriodHour).padStart(2, '0') + ':00'
    const entry = weatherData?.hourly.find((h) => h.time === repHourStr) ?? null
    return entry ? hourlyToCurrentWeather(entry, base) : base
  }, [weatherData, selectedPeriodHour, hour])

  // Highlight range for HourlyWeatherStrip
  const selectedPeriod = TIME_PERIODS.find((p) => p.repHour === selectedPeriodHour)

  // Filter hourly data to show only entries from the selected period onwards
  const displayedHourly = useMemo((): HourlyForecast[] => {
    const hourly = weatherData?.hourly ?? []
    if (!selectedPeriod || !hourly.length) return hourly

    const selIdx = getPeriodIndex(selectedPeriodHour)
    const curIdx = getPeriodIndex(hour)
    const isTomorrow = selIdx < curIdx

    const toHourNum = (t: string) => parseInt(t.split(':')[0], 10)

    if (selIdx === curIdx) {
      // Current period: start from now
      const idx = hourly.findIndex(h => toHourNum(h.time) >= hour)
      return idx >= 0 ? hourly.slice(idx) : hourly
    }

    if (!isTomorrow) {
      // Same-day future period
      const idx = hourly.findIndex(h => toHourNum(h.time) >= selectedPeriod.start)
      return idx >= 0 ? hourly.slice(idx) : hourly
    }

    // Tomorrow's period: find midnight crossing, then period start after it
    const midnightIdx = hourly.findIndex((h, i) =>
      i > 0 && toHourNum(h.time) < toHourNum(hourly[i - 1].time)
    )
    if (midnightIdx < 0) return hourly
    const afterMidnight = hourly.slice(midnightIdx)
    const startIdx = afterMidnight.findIndex(h => toHourNum(h.time) >= selectedPeriod.start)
    return startIdx >= 0 ? afterMidnight.slice(startIdx) : afterMidnight
  }, [weatherData, selectedPeriod, selectedPeriodHour, hour])

  const uvForCard = useMemo(() => {
    const base = weatherData?.current
    if (!base || !displayWeather) return undefined
    if (displayWeather.uvIndex > 0) return displayWeather.uvIndex
    return base.uvIndex
  }, [weatherData, displayWeather])

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
      onSelect={setSelectedPeriodHour}
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
    />
  )
  const hourlyStrip = (
    <HourlyWeatherStrip
      hourly={displayedHourly}
      currentHour={hour}
      selectedPeriodStart={selectedPeriod?.start}
      selectedPeriodEnd={selectedPeriod?.end}
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
  const weeklyForecast = (
    <WeeklyForecastInline daily={weekly} hourly={weatherData?.hourly ?? []} loading={weeklyLoading} />
  )
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
          recentChips={<>{recentChips}{nearbyChips}</>}
          periodPicker={timePeriodPicker}
          weatherContent={
            <>
              {weatherCard}
              {hourlyStrip}
              {highlightsGrid}
              {weeklyForecast}
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
              <GpsButton loading={gpsLoading} error={gpsError} onClick={requestGps} />
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
              {weeklyForecast}
              {outfitPanel}
            </>
          }
        />
      </div>
    </>
  )
}

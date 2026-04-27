'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { LocationSearchBar } from '@/components/weather/LocationSearchBar'
import { GpsButton } from '@/components/weather/GpsButton'
import { RecentChips, saveRecentLocation } from '@/components/weather/RecentChips'
import { WeatherCard } from '@/components/weather/WeatherCard'
import { HourlyWeatherStrip } from '@/components/weather/HourlyWeatherStrip'
import { WeeklyForecastInline } from '@/components/weather/WeeklyForecastInline'
import { HighlightsGrid } from '@/components/weather/HighlightsGrid'
import { OutfitPanel } from '@/components/outfit/OutfitPanel'
import { useAutoLocation } from '@/lib/hooks/useAutoLocation'
import { useWeather } from '@/lib/hooks/useWeather'
import { useWeeklyForecast } from '@/lib/hooks/useWeeklyForecast'
import { getTimeOfDay, currentHour } from '@/lib/utils/timeOfDay'
import type { DustData, SunriseSunset, WeatherAlert } from '@/types/weather'
import type { LocationInfo } from '@/types/location'

export default function HomePage() {
  const { location, gpsLoading, gpsError, requestGps, setManualLocation } = useAutoLocation()
  const { data: weatherData, loading: weatherLoading } = useWeather(location)
  const { data: weekly, loading: weeklyLoading } = useWeeklyForecast(location)

  const [dust, setDust] = useState<DustData | null>(null)
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunset | null>(null)
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])

  const hour = currentHour()
  const period = getTimeOfDay(hour, sunriseSunset?.sunrise, sunriseSunset?.sunset)

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

  const weatherCard = (
    <WeatherCard weather={weatherData?.current ?? null} period={period} loading={weatherLoading} />
  )
  const hourlyStrip = (
    <HourlyWeatherStrip hourly={weatherData?.hourly ?? []} currentHour={hour} />
  )
  const highlightsGrid = (
    <HighlightsGrid
      weather={weatherData?.current ?? null}
      dust={dust}
      sunriseSunset={sunriseSunset}
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
      weather={weatherData?.current ?? null}
      dust={dust}
      terrain={location.terrain ?? 'urban'}
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
          recentChips={recentChips}
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

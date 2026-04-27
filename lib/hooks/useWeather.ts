'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CurrentWeather, HourlyForecast } from '@/types/weather'
import type { LocationInfo } from '@/types/location'

interface WeatherData {
  current: CurrentWeather
  hourly: HourlyForecast[]
  fetchedAt: number
}

export function useWeather(location: LocationInfo | null) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWithRetry = useCallback(async (loc: LocationInfo, attempt = 0): Promise<WeatherData> => {
    const url = `/api/weather?nx=${loc.nx}&ny=${loc.ny}&lat=${loc.lat}&lon=${loc.lon}&name=${encodeURIComponent(loc.name)}`
    const res = await fetch(url)
    if (!res.ok) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
        return fetchWithRetry(loc, attempt + 1)
      }
      throw new Error('날씨 데이터 로드 실패')
    }
    return res.json()
  }, [])

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchWithRetry(location)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false) } })

    return () => { cancelled = true }
  }, [location, fetchWithRetry])

  return { data, loading, error }
}

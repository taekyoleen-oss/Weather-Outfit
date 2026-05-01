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

  const fetchWithRetry = useCallback(
    async (loc: LocationInfo, signal: AbortSignal, attempt = 0): Promise<WeatherData> => {
      const url = `/api/weather?nx=${loc.nx}&ny=${loc.ny}&lat=${loc.lat}&lon=${loc.lon}&name=${encodeURIComponent(loc.name)}`
      const res = await fetch(url, { signal })
      if (!res.ok) {
        if (attempt < 3) {
          await new Promise<void>((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
          return fetchWithRetry(loc, signal, attempt + 1)
        }
        throw new Error('날씨 데이터 로드 실패')
      }
      return res.json()
    },
    []
  )

  useEffect(() => {
    if (!location) return
    const ac = new AbortController()
    setLoading(true)
    setError(null)

    fetchWithRetry(location, ac.signal)
      .then((d) => { if (!ac.signal.aborted) { setData(d); setLoading(false) } })
      .catch((e) => {
        if (ac.signal.aborted || (e as Error).name === 'AbortError') return
        setError((e as Error).message)
        setLoading(false)
      })

    return () => { ac.abort() }
  }, [location, fetchWithRetry])

  return { data, loading, error }
}

'use client'

import { useState, useEffect } from 'react'
import type { DailyForecast } from '@/types/weather'
import type { LocationInfo } from '@/types/location'

export function useWeeklyForecast(location: LocationInfo | null) {
  const [data, setData] = useState<DailyForecast[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setLoading(true)

    fetch(`/api/weather/weekly?nx=${location.nx}&ny=${location.ny}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d)) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [location])

  return { data, loading }
}

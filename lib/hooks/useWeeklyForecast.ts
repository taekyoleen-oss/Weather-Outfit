'use client'

import { useState, useEffect } from 'react'
import type { DailyForecast } from '@/types/weather'
import type { LocationInfo } from '@/types/location'

export function useWeeklyForecast(location: LocationInfo | null) {
  const [data, setData] = useState<DailyForecast[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!location) return
    const ac = new AbortController()
    setLoading(true)

    fetch(`/api/weather/weekly?nx=${location.nx}&ny=${location.ny}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => { if (!ac.signal.aborted && Array.isArray(d)) { setData(d); setLoading(false) } })
      .catch((e) => { if (ac.signal.aborted || (e as Error).name === 'AbortError') return; setLoading(false) })

    return () => { ac.abort() }
  }, [location])

  return { data, loading }
}

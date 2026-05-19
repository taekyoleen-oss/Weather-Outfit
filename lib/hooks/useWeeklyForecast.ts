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

    // cache: 'no-store' — 서버 측 KV 캐시(6h)는 유지하면서 클라이언트는 항상 신선한 응답을 받아
    // 데이터 shape 변경(예: AM/PM 필드 추가) 시 max-age=600 브라우저 캐시가 stale 응답을 잡지 않게 함
    fetch(`/api/weather/weekly?nx=${location.nx}&ny=${location.ny}`, { signal: ac.signal, cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!ac.signal.aborted && Array.isArray(d)) { setData(d); setLoading(false) } })
      .catch((e) => { if (ac.signal.aborted || (e as Error).name === 'AbortError') return; setLoading(false) })

    return () => { ac.abort() }
  }, [location])

  return { data, loading }
}

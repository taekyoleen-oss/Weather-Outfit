'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LocationInfo } from '@/types/location'

const DEFAULT_LOCATION: LocationInfo = {
  name: '서울',
  lat: 37.5665,
  lon: 126.9780,
  nx: 60,
  ny: 127,
  terrain: 'urban',
}

const STORAGE_KEY = 'weatherfit:lastLocation'

function loadStoredLocation(): LocationInfo | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storeLocation(loc: LocationInfo) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
  } catch {}
}

export function useAutoLocation() {
  const [location, setLocation] = useState<LocationInfo>(() => loadStoredLocation() ?? DEFAULT_LOCATION)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      return
    }
    setGpsLoading(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        try {
          const res = await fetch(`/api/location/resolve?lat=${lat}&lon=${lon}`)
          const data = await res.json()
          const loc: LocationInfo = {
            name: data.name ?? '현재 위치',
            lat,
            lon,
            nx: data.nx,
            ny: data.ny,
            terrain: 'urban',
          }
          setLocation(loc)
          storeLocation(loc)
        } catch {
          setGpsError('위치 변환에 실패했습니다.')
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.')
        } else {
          setGpsError('위치를 가져올 수 없습니다.')
        }
      },
      { timeout: 5000, enableHighAccuracy: false }
    )
  }, [])

  const setManualLocation = useCallback((loc: LocationInfo) => {
    setLocation(loc)
    storeLocation(loc)
    setGpsError(null)
  }, [])

  return { location, gpsLoading, gpsError, requestGps, setManualLocation }
}

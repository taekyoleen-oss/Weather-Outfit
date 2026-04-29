'use client'

import { useState, useCallback } from 'react'
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

function isValidStored(data: unknown): data is LocationInfo {
  if (!data || typeof data !== 'object') return false
  const o = data as Record<string, unknown>
  return (
    typeof o.lat === 'number' &&
    typeof o.lon === 'number' &&
    typeof o.nx === 'number' &&
    typeof o.ny === 'number' &&
    typeof o.name === 'string'
  )
}

function loadStoredLocation(): LocationInfo | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!isValidStored(data)) return null
    const { lat, lon, nx, ny, name, address, terrain } = data
    return { lat, lon, nx, ny, name, address, terrain: terrain ?? 'urban' }
  } catch {
    return null
  }
}

function storeLocation(loc: LocationInfo) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loc, savedAt: Date.now() }))
  } catch {
    /* quota / private mode */
  }
}

function getCurrentPositionAsync(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation!.getCurrentPosition(resolve, reject, options)
  })
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

    void (async () => {
      const applyStored = (): boolean => {
        const s = loadStoredLocation()
        if (!s) return false
        setLocation(s)
        setGpsError(null)
        return true
      }

      const resolveFromCoords = async (lat: number, lon: number) => {
        const res = await fetch(`/api/location/resolve?lat=${lat}&lon=${lon}`)
        if (!res.ok) throw new Error('resolve failed')
        const data = (await res.json()) as { name?: string; address?: string; nx?: number; ny?: number }
        const loc: LocationInfo = {
          name: data.name ?? '현재 위치',
          address: typeof data.address === 'string' ? data.address : undefined,
          lat,
          lon,
          nx: Number(data.nx),
          ny: Number(data.ny),
          terrain: 'urban',
        }
        if (!Number.isFinite(loc.nx) || !Number.isFinite(loc.ny)) throw new Error('invalid grid')
        setLocation(loc)
        storeLocation(loc)
      }

      let pos: GeolocationPosition | null = null
      let lastErrCode: number | undefined
      const attempts: PositionOptions[] = [
        { enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 },
        { enableHighAccuracy: false, timeout: 12_000, maximumAge: 86_400_000 },
      ]
      for (const opts of attempts) {
        try {
          pos = await getCurrentPositionAsync(opts)
          break
        } catch (e) {
          lastErrCode = (e as GeolocationPositionError).code
        }
      }

      try {
        if (pos) {
          const { latitude: lat, longitude: lon } = pos.coords
          await resolveFromCoords(lat, lon)
        } else if (!applyStored()) {
          if (lastErrCode === GeolocationPositionError.PERMISSION_DENIED) {
            setGpsError('위치 권한이 거부되었습니다. 브라우저 설정에서 허용하거나, 검색으로 지역을 선택해 주세요.')
          } else {
            setGpsError(
              'GPS로 위치를 잡지 못했습니다. 이전에 저장된 위치가 없으면 검색으로 지역을 선택해 주세요.'
            )
          }
        }
      } catch {
        if (!applyStored()) {
          setGpsError('위치 변환에 실패했습니다. 검색으로 지역을 선택해 주세요.')
        }
      } finally {
        setGpsLoading(false)
      }
    })()
  }, [])

  const setManualLocation = useCallback((loc: LocationInfo) => {
    setLocation(loc)
    storeLocation(loc)
    setGpsError(null)
  }, [])

  return { location, gpsLoading, gpsError, requestGps, setManualLocation }
}

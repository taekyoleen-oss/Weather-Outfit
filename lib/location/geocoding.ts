import type { LocationInfo } from '@/types/location'
import { latLonToGrid } from './geoConvert'
import { detectTerrain } from './terrainDetector'

/**
 * Nominatim(OpenStreetMap) 지오코딩 — Kakao API 실패 시 fallback
 * ToS: User-Agent 필수, 초당 1건 이하
 */
export async function searchNominatim(query: string): Promise<LocationInfo[]> {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&countrycodes=kr&addressdetails=1&limit=5`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'WeatherFit/1.0 (weather-outfit-suggestion)',
      'Accept-Language': 'ko,en',
    },
    next: { revalidate: 1800 },
  })

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = await res.json()

  return data.map((item) => {
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    const grid = latLonToGrid({ lat, lon })

    const addr = item.address ?? {}
    // 대표 지명 선택: 동/읍/면 > 구/군 > 시 > 도 순
    const name =
      addr.quarter ||
      addr.neighbourhood ||
      addr.suburb ||
      addr.city_district ||
      addr.borough ||
      addr.town ||
      addr.city ||
      addr.county ||
      item.display_name.split(',')[0].trim()

    const address = [
      addr.city || addr.town || addr.county,
      addr.city_district || addr.borough,
      addr.suburb || addr.quarter,
    ]
      .filter(Boolean)
      .join(' ')

    return {
      name,
      address: address || item.display_name.split(',').slice(0, 3).join(','),
      lat,
      lon,
      nx: grid.nx,
      ny: grid.ny,
      terrain: detectTerrain(name, address, ''),
    } satisfies LocationInfo
  })
}

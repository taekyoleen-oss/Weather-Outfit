import type { KakaoSearchResult } from '@/types/location'

const KAKAO_API_BASE = 'https://dapi.kakao.com/v2/local'

export async function searchKakaoKeyword(query: string, size = 5): Promise<KakaoSearchResult[]> {
  const key = process.env.KAKAO_LOCAL_API_KEY
  if (!key) throw new Error('KAKAO_LOCAL_API_KEY not set')

  const url = `${KAKAO_API_BASE}/search/keyword.json?query=${encodeURIComponent(query)}&size=${size}`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`Kakao API error: ${res.status}`)
  const data = await res.json()
  return data.documents as KakaoSearchResult[]
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const key = process.env.KAKAO_LOCAL_API_KEY
  if (!key) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`

  const url = `${KAKAO_API_BASE}/geo/coord2address.json?x=${lon}&y=${lat}`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  const data = await res.json()
  const doc = data.documents?.[0]
  if (!doc) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`

  return doc.road_address?.address_name || doc.address?.address_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

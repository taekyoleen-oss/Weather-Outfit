import type { KakaoSearchResult } from '@/types/location'

const KAKAO_API_BASE = 'https://dapi.kakao.com/v2/local'

export async function searchKakaoKeyword(query: string, size = 5): Promise<KakaoSearchResult[]> {
  const key = process.env.KAKAO_LOCAL_API_KEY
  if (!key) throw new Error('KAKAO_LOCAL_API_KEY not set')

  const url = `${KAKAO_API_BASE}/search/keyword.json?query=${encodeURIComponent(query)}&size=${size}`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Kakao keyword API error: ${res.status}`)
  const data = await res.json()
  if (data.errorType) throw new Error(`Kakao: ${data.message}`)
  return (data.documents ?? []) as KakaoSearchResult[]
}

export async function searchKakaoAddress(query: string, size = 5): Promise<KakaoSearchResult[]> {
  const key = process.env.KAKAO_LOCAL_API_KEY
  if (!key) throw new Error('KAKAO_LOCAL_API_KEY not set')

  const url = `${KAKAO_API_BASE}/search/address.json?query=${encodeURIComponent(query)}&size=${size}`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Kakao address API error: ${res.status}`)
  const data = await res.json()
  if (data.errorType) throw new Error(`Kakao: ${data.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.documents ?? []).map((doc: any) => ({
    place_name: doc.road_address?.address_name || doc.address?.address_name || doc.address_name,
    address_name: doc.address?.address_name || doc.address_name,
    road_address_name: doc.road_address?.address_name || '',
    x: doc.x,
    y: doc.y,
    category_group_code: '',
    category_name: '주소',
  })) as KakaoSearchResult[]
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

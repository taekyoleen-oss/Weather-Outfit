import type { SunriseSunset } from '@/types/weather'
import { safeFetch } from '@/lib/utils/safeFetch'
import { kstTodayYmd } from '@/lib/utils/timeOfDay'

const BASE = 'http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService'

let _kmaKey: string | null = null
function kmaKey(): string {
  if (_kmaKey !== null) return _kmaKey
  const raw = process.env.KMA_API_KEY ?? ''
  try { _kmaKey = decodeURIComponent(raw) } catch { _kmaKey = raw }
  return _kmaKey
}

export async function fetchSunriseSunset(lat: number, lon: number): Promise<SunriseSunset> {
  // kstTodayYmd() 사용: UTC 기반 new Date()는 09:00 KST 이전에 어제 날짜를 반환하는 버그 방지
  const locdate = kstTodayYmd()

  const params = new URLSearchParams({
    serviceKey: kmaKey(),
    locdate,
    longitude: lon.toFixed(6),
    latitude: lat.toFixed(6),
    dnYn: 'Y',
  })

  const url = `${BASE}/getLCRiseSetInfo?${params}`
  const res = await safeFetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Sunrise API error: ${res.status}`)

  const text = await res.text()
  const sunrise = text.match(/<sunrise>(\d+)<\/sunrise>/)?.[1] ?? '0600'
  const sunset = text.match(/<sunset>(\d+)<\/sunset>/)?.[1] ?? '1830'

  return { sunrise, sunset, date: locdate }
}

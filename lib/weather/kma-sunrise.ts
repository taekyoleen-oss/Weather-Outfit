import type { SunriseSunset } from '@/types/weather'

const BASE = 'http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService'

function kmaKey(): string {
  return process.env.KMA_API_KEY ?? ''
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

export async function fetchSunriseSunset(lat: number, lon: number): Promise<SunriseSunset> {
  const today = new Date()
  const locdate = formatDate(today)

  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(kmaKey()),
    locdate,
    longitude: lon.toFixed(6),
    latitude: lat.toFixed(6),
    dnYn: 'Y',
  })

  const url = `${BASE}/getLCRiseSetInfo?${params}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Sunrise API error: ${res.status}`)

  const text = await res.text()
  const sunrise = text.match(/<sunrise>(\d+)<\/sunrise>/)?.[1] ?? '0600'
  const sunset = text.match(/<sunset>(\d+)<\/sunset>/)?.[1] ?? '1830'

  return { sunrise, sunset, date: locdate }
}

import type { WeatherAlert } from '@/types/weather'

/** 기상청 날씨누리 — 기상특보 발효현황 */
export const KMA_WEATHER_WARN_PAGE =
  'https://www.weather.go.kr/w/special-report/overall.do'

const BASE = 'http://apis.data.go.kr/1360000/WthrWrnInfoService'

function kmaKey(): string {
  return process.env.KMA_API_KEY ?? ''
}

export async function fetchWeatherAlerts(regCode: string): Promise<WeatherAlert[]> {
  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(kmaKey()),
    pageNo: '1',
    numOfRows: '10',
    dataType: 'JSON',
    stnId: regCode,
  })

  const url = `${BASE}/getWthrWrnList?${params}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) return []

  const json = await res.json()
  const items = json?.response?.body?.items?.item
  if (!Array.isArray(items)) return []

  return items.map((item: Record<string, string>) => ({
    type: item.wrn ?? '',
    level: item.lvl ?? '',
    region: item.stnId ?? regCode,
    message: item.title ?? '',
    startTime: item.tmEf ?? '',
    endTime: item.tmFc ?? '',
  }))
}

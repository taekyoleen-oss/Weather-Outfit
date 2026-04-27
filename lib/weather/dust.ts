import type { DustData } from '@/types/weather'

const BASE = 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc'

export async function fetchDust(stationName: string): Promise<DustData> {
  const key = process.env.AIRKOREA_API_KEY
  if (!key) throw new Error('AIRKOREA_API_KEY not set')

  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(key),
    returnType: 'json',
    numOfRows: '1',
    pageNo: '1',
    stationName,
    dataTerm: 'DAILY',
    ver: '1.0',
  })

  const url = `${BASE}/getMsrstnAcctoRltmMesureDnsty?${params}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Air Korea API error: ${res.status}`)

  const json = await res.json()
  const item = json?.response?.body?.items?.[0]
  if (!item) throw new Error('No dust data')

  const pm10Value = parseFloat(item.pm10Value)
  const pm25Value = parseFloat(item.pm25Value)
  if (isNaN(pm10Value) || isNaN(pm25Value)) throw new Error('Dust values not available (sensor under maintenance)')

  const o3Raw = parseFloat(item.o3Value)
  const o3Value = isNaN(o3Raw) ? undefined : o3Raw
  const o3Grade = item.o3Grade ?? undefined

  return {
    pm10Value,
    pm25Value,
    pm10Grade: item.pm10Grade ?? '2',
    pm25Grade: item.pm25Grade ?? '2',
    o3Value,
    o3Grade,
    stationName,
    fetchedAt: Date.now(),
  }
}

// Nearest station names by rough region
export function getNearestStation(nx: number, ny: number): string {
  if (nx >= 58 && nx <= 68 && ny >= 125 && ny <= 135) return '중구'
  if (nx >= 65 && nx <= 75 && ny >= 125 && ny <= 135) return '강남구'
  if (nx >= 85 && nx <= 100 && ny >= 85 && ny <= 100) return '부산 중구'
  if (nx >= 85 && nx <= 100 && ny >= 100 && ny <= 115) return '대구 중구'
  return '중구'
}

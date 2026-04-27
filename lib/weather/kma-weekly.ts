import type { DailyForecast, SkyCode, PtyCode } from '@/types/weather'

const KMA_BASE = 'http://apis.data.go.kr/1360000/MidFcstInfoService'

function kmaKey(): string {
  const key = process.env.KMA_API_KEY
  if (!key) throw new Error('KMA_API_KEY not set')
  return key
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

// Map nx/ny approximate region to KMA mid-forecast region code
export function getMidRegionCode(nx: number, ny: number): string {
  // Seoul / Gyeonggi
  if (nx >= 55 && nx <= 75 && ny >= 120 && ny <= 140) return '11B00000'
  // Busan/Gyeongnam
  if (nx >= 85 && nx <= 100 && ny >= 80 && ny <= 100) return '11H20000'
  // Daegu/Gyeongbuk
  if (nx >= 85 && nx <= 100 && ny >= 100 && ny <= 120) return '11H10000'
  // Gwangju/Jeonnam
  if (nx >= 55 && nx <= 75 && ny >= 75 && ny <= 100) return '11F20000'
  // Jeonbuk
  if (nx >= 55 && nx <= 75 && ny >= 100 && ny <= 120) return '11F10000'
  // Chungnam
  if (nx >= 55 && nx <= 75 && ny >= 115 && ny <= 130) return '11C20000'
  // Chungbuk
  if (nx >= 68 && nx <= 82 && ny >= 115 && ny <= 130) return '11C10000'
  // Gangwon
  if (nx >= 82 && nx <= 110 && ny >= 125 && ny <= 150) return '11D10000'
  // Jeju
  if (nx >= 50 && nx <= 60 && ny >= 55 && ny <= 65) return '11G00000'
  return '11B00000'
}

export async function fetchWeeklyForecast(nx: number, ny: number): Promise<DailyForecast[]> {
  const now = new Date()
  const tmFc = formatDate(now) + (now.getHours() >= 18 ? '1800' : '0600')
  const regId = getMidRegionCode(nx, ny)

  const [landRes, tempRes] = await Promise.allSettled([
    fetchMidLand(regId, tmFc),
    fetchMidTemp(regId, tmFc),
  ])

  const land = landRes.status === 'fulfilled' ? landRes.value : null
  const temp = tempRes.status === 'fulfilled' ? tempRes.value : null

  const forecasts: DailyForecast[] = []
  for (let i = 3; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const dateStr = formatDate(d)

    forecasts.push({
      date: dateStr,
      minTemp: temp?.[`taMin${i}`] ?? 10,
      maxTemp: temp?.[`taMax${i}`] ?? 20,
      skyCode: (land?.[`wf${i}Am`] ? skyFromLabel(land[`wf${i}Am`]) : '3') as SkyCode,
      ptyCode: '0' as PtyCode,
      pop: parseInt(land?.[`rnSt${i}Am`] ?? '20', 10),
    })
  }

  return forecasts
}

async function fetchMidLand(regId: string, tmFc: string): Promise<Record<string, string>> {
  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(process.env.KMA_API_KEY ?? ''),
    pageNo: '1',
    numOfRows: '10',
    dataType: 'JSON',
    regId,
    tmFc,
  })
  const res = await fetch(`${KMA_BASE}/getMidLandFcst?${params}`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`KMA mid-land API: ${res.status}`)
  const json = await res.json()
  return json?.response?.body?.items?.item?.[0] ?? {}
}

async function fetchMidTemp(regId: string, tmFc: string): Promise<Record<string, number>> {
  const stnId = regId.slice(0, 5) === '11B00' ? '108' : '159'
  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(process.env.KMA_API_KEY ?? ''),
    pageNo: '1',
    numOfRows: '10',
    dataType: 'JSON',
    regId: stnId,
    tmFc,
  })
  const res = await fetch(`${KMA_BASE}/getMidTa?${params}`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`KMA mid-temp API: ${res.status}`)
  const json = await res.json()
  return json?.response?.body?.items?.item?.[0] ?? {}
}

function skyFromLabel(label: string): SkyCode {
  if (label.includes('맑음')) return '1'
  if (label.includes('구름많음') || label.includes('구름 많음')) return '3'
  return '4'
}

import type { DailyForecast, SkyCode, PtyCode } from '@/types/weather'

const KMA_BASE = 'http://apis.data.go.kr/1360000/MidFcstInfoService'

function kmaKey(): string {
  const key = process.env.KMA_API_KEY
  if (!key) throw new Error('KMA_API_KEY not set')
  return key
}

// KST = UTC+9; KMA API uses Korean Standard Time
function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

// getMidTa uses temperature forecast region codes (기온예보구역코드), different from land forecast region codes
function getMidTaCode(regId: string): string {
  const MAP: Record<string, string> = {
    '11B00000': '11B10001', // 서울
    '11H20000': '11H20201', // 부산
    '11H10000': '11H10701', // 대구
    '11F20000': '11F20501', // 광주
    '11F10000': '11F10201', // 전주
    '11C20000': '11C20401', // 대전
    '11C10000': '11C10301', // 청주
    '11D10000': '11D10301', // 강릉
    '11G00000': '11G00201', // 제주
  }
  return MAP[regId] ?? '11B10001'
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
  const now = kstNow()
  const kstHour = now.getUTCHours()
  const tmFc = formatDate(now) + (kstHour >= 18 ? '1800' : '0600')
  const regId = getMidRegionCode(nx, ny)

  const [landRes, tempRes] = await Promise.allSettled([
    fetchMidLand(regId, tmFc),
    fetchMidTemp(regId, tmFc),
  ])

  const land = landRes.status === 'fulfilled' ? landRes.value : null
  const temp = tempRes.status === 'fulfilled' ? tempRes.value : null

  const forecasts: DailyForecast[] = []
  for (let i = 3; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
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

function parseItem<T>(json: unknown): T | null {
  const raw = (json as Record<string, unknown>)?.response as Record<string, unknown>
  const body = raw?.body as Record<string, unknown>
  const items = body?.items as Record<string, unknown>
  const item = items?.item
  if (!item) return null
  // KMA sometimes returns a single object instead of an array
  return (Array.isArray(item) ? item[0] : item) as T
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
  const resultCode = (json?.response?.header?.resultCode as string) ?? 'unknown'
  if (resultCode !== '00') {
    console.error(`[getMidLandFcst] resultCode=${resultCode} regId=${regId} tmFc=${tmFc}`)
    return {}
  }
  return parseItem<Record<string, string>>(json) ?? {}
}

async function fetchMidTemp(regId: string, tmFc: string): Promise<Record<string, number>> {
  const taRegId = getMidTaCode(regId)
  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(process.env.KMA_API_KEY ?? ''),
    pageNo: '1',
    numOfRows: '10',
    dataType: 'JSON',
    regId: taRegId,
    tmFc,
  })
  const res = await fetch(`${KMA_BASE}/getMidTa?${params}`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`KMA mid-temp API: ${res.status}`)
  const json = await res.json()
  const resultCode = (json?.response?.header?.resultCode as string) ?? 'unknown'
  if (resultCode !== '00') {
    console.error(`[getMidTa] resultCode=${resultCode} taRegId=${taRegId} tmFc=${tmFc}`)
    return {}
  }
  return parseItem<Record<string, number>>(json) ?? {}
}

function skyFromLabel(label: string): SkyCode {
  if (label.includes('맑음')) return '1'
  if (label.includes('구름많음') || label.includes('구름 많음')) return '3'
  return '4'
}

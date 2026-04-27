import { z } from 'zod'
import type { CurrentWeather, HourlyForecast, SkyCode, PtyCode } from '@/types/weather'
import { feelsLike } from '@/lib/utils/formatWeather'

const KMA_BASE = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'

function kmaKey(): string {
  const key = process.env.KMA_API_KEY
  if (!key) throw new Error('KMA_API_KEY not set')
  return key
}

// KST = UTC+9; KMA API uses Korean Standard Time for all dates/times
function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function formatTime(d: Date): string {
  const h = d.getUTCHours() // getUTCHours on a KST-adjusted Date gives KST hours
  const baseHours = [2, 5, 8, 11, 14, 17, 20, 23]
  const base = baseHours.reduce((prev, curr) => (Math.abs(curr - h) < Math.abs(prev - h) ? curr : prev))
  return String(base).padStart(2, '0') + '00'
}

const ItemSchema = z.object({
  category: z.string(),
  fcstDate: z.string(),
  fcstTime: z.string(),
  fcstValue: z.string(),
  nx: z.number(),
  ny: z.number(),
})

export async function fetchVilageForecast(nx: number, ny: number): Promise<{
  current: CurrentWeather
  hourly: HourlyForecast[]
}> {
  const now = kstNow()
  const baseDate = formatDate(now)
  const baseTime = formatTime(now)

  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(kmaKey()),
    pageNo: '1',
    numOfRows: '1000',
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx: String(nx),
    ny: String(ny),
  })

  const url = `${KMA_BASE}/getVilageFcst?${params}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`KMA API error: ${res.status}`)
  const json = await res.json()

  const items = json?.response?.body?.items?.item
  if (!Array.isArray(items)) throw new Error('KMA API: unexpected response format')

  return parseVilageFcst(items, nx, ny)
}

interface FcstMap {
  [dateTime: string]: Record<string, string>
}

function parseVilageFcst(
  items: unknown[],
  nx: number,
  ny: number
): { current: CurrentWeather; hourly: HourlyForecast[] } {
  const map: FcstMap = {}

  for (const raw of items) {
    const parsed = ItemSchema.safeParse(raw)
    if (!parsed.success) continue
    const { category, fcstDate, fcstTime, fcstValue } = parsed.data
    const key = `${fcstDate}${fcstTime}`
    if (!map[key]) map[key] = {}
    map[key][category] = fcstValue
  }

  const sortedKeys = Object.keys(map).sort()
  const now = kstNow()
  const nowKey = formatDate(now) + String(now.getUTCHours()).padStart(2, '0') + '00'

  // Find closest key for current
  const closestKey = sortedKeys.reduce((prev, curr) =>
    Math.abs(parseInt(curr) - parseInt(nowKey)) < Math.abs(parseInt(prev) - parseInt(nowKey)) ? curr : prev,
    sortedKeys[0]
  )

  const cur = map[closestKey] ?? {}
  const temp = parseFloat(cur.TMP ?? cur.T1H ?? '0')
  const humid = parseFloat(cur.REH ?? '50')
  const wind = parseFloat(cur.WSD ?? '0')

  const current: CurrentWeather = {
    temperature: temp,
    feelsLike: feelsLike(temp, wind, humid),
    humidity: humid,
    windSpeed: wind,
    windDirection: parseFloat(cur.VEC ?? '0'),
    skyCode: (cur.SKY ?? '1') as SkyCode,
    ptyCode: (cur.PTY ?? '0') as PtyCode,
    precipitation: parseFloat(cur.RN1 ?? cur.PCP ?? '0') || 0,
    uvIndex: parseFloat(cur.UVI ?? '0'),
    visibility: parseFloat(cur.VIS ?? '10') * 100,
    location: '',
    nx,
    ny,
    fetchedAt: Date.now(),
  }

  const hourly: HourlyForecast[] = sortedKeys.slice(0, 48).map((k) => {
    const h = map[k]
    const t = parseFloat(h.TMP ?? '0')
    const w = parseFloat(h.WSD ?? '0')
    const rh = parseFloat(h.REH ?? '50')
    return {
      time: k.slice(8, 10) + ':00',
      temperature: t,
      skyCode: (h.SKY ?? '1') as SkyCode,
      ptyCode: (h.PTY ?? '0') as PtyCode,
      precipitation: parseFloat(h.PCP ?? '0') || 0,
      humidity: rh,
      windSpeed: w,
      pop: parseFloat(h.POP ?? '0'),
    }
  })

  return { current, hourly }
}

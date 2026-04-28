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

/** 현재 시각을 커버하는 가장 최근 KMA 단기예보 발표 시각과 날짜를 반환한다.
 *
 *  KMA 단기예보(getVilageFcst) 발표 시각: 02, 05, 08, 11, 14, 17, 20, 23시.
 *  발표 시각 B의 첫 번째 예보 시각(fcstTime)은 B+1시부터 시작한다.
 *  → 현재 시각 H를 포함하려면 base + 1 ≤ H, 즉 base < H 여야 한다.
 *
 *  예) H=11시 → base=08 (09시~데이터, 11시 포함 ✓)
 *      H=12시 → base=11 (12시~데이터, 12시 포함 ✓)
 *      H=15시 → base=11 (12시~데이터, 15시 포함 ✓)  ← 14시 base는 15:00부터라 동일
 */
function getBaseDateTime(now: Date): { baseDate: string; baseTime: string } {
  const h = now.getUTCHours()
  const baseHours = [2, 5, 8, 11, 14, 17, 20, 23]
  // base + 1 ≤ h  →  base < h
  const valid = baseHours.filter((b) => b < h)
  if (valid.length > 0) {
    return {
      baseDate: formatDate(now),
      baseTime: String(valid[valid.length - 1]).padStart(2, '0') + '00',
    }
  }
  // 자정~02시 미만(h=0,1): 전날 23시 발표 자료 사용 (00:00~부터 데이터 포함)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  return { baseDate: formatDate(yesterday), baseTime: '2300' }
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
  const { baseDate, baseTime } = getBaseDateTime(now)

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
  const dayPrefix = nowKey.slice(0, 8)
  const sameDayKeys = sortedKeys.filter((k) => k.startsWith(dayPrefix))
  const pool = sameDayKeys.length ? sameDayKeys : sortedKeys
  const nk = parseInt(nowKey, 10)

  /** 현재 시각 이하(동일 KST 일) 중 가장 늦은 예보 시각 — 11:02면 11시 슬롯, 12시 슬롯으로 끌려가지 않음 */
  let currentKey: string | null = null
  let bestLe = -Infinity
  for (const k of pool) {
    const v = parseInt(k, 10)
    if (v <= nk && v > bestLe) {
      bestLe = v
      currentKey = k
    }
  }
  if (!currentKey) {
    currentKey = pool.find((k) => parseInt(k, 10) >= nk) ?? pool[0] ?? sortedKeys[0]
  }

  const cur = map[currentKey] ?? {}
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
    basisDateKst: currentKey.slice(0, 8),
  }

  const hourly: HourlyForecast[] = sortedKeys.slice(0, 48).map((k) => {
    const h = map[k]
    const t = parseFloat(h.TMP ?? '0')
    const w = parseFloat(h.WSD ?? '0')
    const rh = parseFloat(h.REH ?? '50')
    return {
      fcstDate: k.slice(0, 8),
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

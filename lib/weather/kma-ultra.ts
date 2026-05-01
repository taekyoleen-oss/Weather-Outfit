/**
 * 기상청 동네예보 API 2.0 — 초단기실황(getUltraSrtNcst), 초단기예보(getUltraSrtFcst)
 * @see https://www.data.go.kr (VilageFcstInfoService_2.0)
 *
 * 초단기실황 응답: category, obsrValue, baseDate, baseTime, nx, ny
 * 초단기예보 응답: category, fcstDate, fcstTime, fcstValue, baseDate, baseTime, nx, ny
 */

import { z } from 'zod'
import { safeFetch } from '@/lib/utils/safeFetch'

const KMA_ULTRA_BASE = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'

let _kmaKey: string | null = null
function kmaKey(): string {
  if (_kmaKey !== null) return _kmaKey
  const raw = process.env.KMA_API_KEY
  if (!raw) throw new Error('KMA_API_KEY not set')
  try { _kmaKey = decodeURIComponent(raw) } catch { _kmaKey = raw }
  return _kmaKey
}

/** KST 벽시계 (API base_date / fcst_date 와 동일 체계) */
export function kstWallClock(nowMs = Date.now()): {
  ymd: string
  hour: number
  minute: number
  date: Date
} {
  const k = new Date(nowMs + 9 * 60 * 60 * 1000)
  const y = k.getUTCFullYear()
  const mo = String(k.getUTCMonth() + 1).padStart(2, '0')
  const da = String(k.getUTCDate()).padStart(2, '0')
  return {
    ymd: `${y}${mo}${da}`,
    hour: k.getUTCHours(),
    minute: k.getUTCMinutes(),
    date: k,
  }
}

export function addDaysYmd(ymd: string, delta: number): string {
  const y = parseInt(ymd.slice(0, 4), 10)
  const m = parseInt(ymd.slice(4, 6), 10) - 1
  const d = parseInt(ymd.slice(6, 8), 10)
  const t = Date.UTC(y, m, d) + delta * 86400000
  const u = new Date(t)
  const yy = u.getUTCFullYear()
  const mm = String(u.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(u.getUTCDate()).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

/** base_time(HH00) 기준 초단기실황 1회 조회 */
export async function fetchUltraSrtNcst(
  nx: number,
  ny: number,
  baseDate: string,
  baseTime: string
): Promise<Record<string, string> | null> {
  const params = new URLSearchParams({
    serviceKey: kmaKey(),
    pageNo: '1',
    numOfRows: '500',
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx: String(nx),
    ny: String(ny),
  })
  const url = `${KMA_ULTRA_BASE}/getUltraSrtNcst?${params}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) return null
  const json = (await res.json()) as unknown
  const items = extractItems(json)
  if (!items.length) return null
  const row: Record<string, string> = {}
  const NcstItem = z.object({
    category: z.string(),
    obsrValue: z.string().optional(),
    fcstValue: z.string().optional(),
  })
  for (const raw of items) {
    const p = NcstItem.safeParse(raw)
    if (!p.success) continue
    const v = p.data.obsrValue ?? p.data.fcstValue
    if (v !== undefined) row[p.data.category] = v
  }
  return Object.keys(row).length ? row : null
}

const FcstItemSchema = z.object({
  category: z.string(),
  fcstDate: z.string(),
  fcstTime: z.string(),
  fcstValue: z.string(),
})

function extractItems(json: unknown): unknown[] {
  const raw = (json as { response?: { body?: { items?: { item?: unknown } } } })?.response?.body?.items?.item
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') return [raw]
  return []
}

/**
 * 초단기예보: 10분 단위 base_time 후보를 최신부터 시도해,
 * 특정 fcstDate + fcstTime(HH00) 의 T1H(기온)를 꺼낸다.
 */
export async function fetchUltraSrtFcstT1HAtSlot(
  nx: number,
  ny: number,
  fcstYmd: string,
  fcstHour: number
): Promise<{
  t1h: number
  baseDate: string
  baseTime: string
  fcstDate: string
  fcstTime: string
} | null> {
  const fcstTimeNeed = String(fcstHour).padStart(2, '0') + '00'
  const candidates: { baseDate: string; baseTime: string }[] = []
  /* 최근 발표분부터 역추적(과도한 왕복 방지 — 대부분 1~3회 내 성공) */
  for (let back = 0; back < 12; back++) {
    const shifted = new Date(Date.now() - back * 10 * 60 * 1000 + 9 * 60 * 60 * 1000)
    const y = shifted.getUTCFullYear()
    const mo = String(shifted.getUTCMonth() + 1).padStart(2, '0')
    const da = String(shifted.getUTCDate()).padStart(2, '0')
    const hh = shifted.getUTCHours()
    const mi = Math.floor(shifted.getUTCMinutes() / 10) * 10
    candidates.push({
      baseDate: `${y}${mo}${da}`,
      baseTime: String(hh).padStart(2, '0') + String(mi).padStart(2, '0'),
    })
  }

  const tryCandidate = async (cand: { baseDate: string; baseTime: string }) => {
    const params = new URLSearchParams({
      serviceKey: kmaKey(),
      pageNo: '1',
      numOfRows: '600',
      dataType: 'JSON',
      base_date: cand.baseDate,
      base_time: cand.baseTime,
      nx: String(nx),
      ny: String(ny),
    })
    const url = `${KMA_ULTRA_BASE}/getUltraSrtFcst?${params}`
    const res = await safeFetch(url, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error('not ok')
    const json = (await res.json()) as unknown
    const items = extractItems(json)
    if (!items.length) throw new Error('empty')
    for (const raw of items) {
      const p = FcstItemSchema.safeParse(raw)
      if (!p.success || p.data.category !== 'T1H') continue
      if (p.data.fcstDate === fcstYmd && p.data.fcstTime === fcstTimeNeed) {
        const t1h = parseFloat(p.data.fcstValue)
        if (!Number.isFinite(t1h)) continue
        return { t1h, baseDate: cand.baseDate, baseTime: cand.baseTime, fcstDate: p.data.fcstDate, fcstTime: p.data.fcstTime }
      }
    }
    throw new Error('slot not found')
  }

  // 3개씩 배치로 Promise.any → 첫 배치 실패 시 다음 배치로 폴백
  const BATCH = 3
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH)
    try {
      return await Promise.any(batch.map(tryCandidate))
    } catch {
      // 배치 전체 실패 → 다음 배치
    }
  }
  return null
}

export function parseNcstSurface(row: Record<string, string>): {
  temperature: number
  humidity: number
  windSpeed: number
  ptyCode: string
  rn1: number
} {
  const temperature = parseFloat(row.T1H ?? 'NaN')
  const humidity = parseFloat(row.REH ?? '50')
  const windSpeed = parseFloat(row.WSD ?? '0')
  const ptyCode = row.PTY ?? '0'
  const rn1 = parseFloat(row.RN1 ?? '0') || 0
  return { temperature, humidity, windSpeed, ptyCode, rn1 }
}

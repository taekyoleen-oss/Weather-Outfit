/**
 * 기상청 생활기상지수 조회서비스 V4
 * @see https://www.data.go.kr (LivingWthrIdxServiceV4)
 */

import { safeFetch } from '@/lib/utils/safeFetch'
import { kstWallClock } from '@/lib/weather/kma-ultra'

const LIVING_BASE = 'http://apis.data.go.kr/1360000/LivingWthrIdxServiceV4'

let _kmaKey: string | null = null
function kmaKey(): string {
  if (_kmaKey !== null) return _kmaKey
  const raw = process.env.KMA_API_KEY
  if (!raw) throw new Error('KMA_API_KEY not set')
  try {
    _kmaKey = decodeURIComponent(raw)
  } catch {
    _kmaKey = raw
  }
  return _kmaKey
}

function resultOk(json: unknown): boolean {
  const rc = (json as { response?: { header?: { resultCode?: string } } })?.response?.header?.resultCode
  return rc === '00' || rc === '0'
}

function firstItem(json: unknown): Record<string, string> | null {
  const raw = (json as { response?: { body?: { items?: { item?: unknown } } } })?.response?.body?.items?.item
  if (Array.isArray(raw) && raw.length) return raw[0] as Record<string, string>
  if (raw && typeof raw === 'object') return raw as Record<string, string>
  return null
}

/** h3, h6, … 또는 today 등 첫 유효 숫자 */
function firstForecastNumber(row: Record<string, string>): number | null {
  const preferred = ['h3', 'h6', 'h9', 'h12', 'h15', 'h18', 'h21', 'h24', 'h0', 'today', 'tomorrow', 'day0', 'day1']
  for (const k of preferred) {
    if (row[k] !== undefined) {
      const n = parseFloat(String(row[k]))
      if (Number.isFinite(n)) return n
    }
  }
  for (const [k, v] of Object.entries(row)) {
    if (/^h\d+$/i.test(k)) {
      const n = parseFloat(String(v))
      if (Number.isFinite(n)) return n
    }
  }
  return null
}

function gradeFromRow(row: Record<string, string>, valueKey: string): string | undefined {
  return row[`${valueKey}Grade`] ?? row.grade ?? row.danger ?? row.level
}

async function callLiving(endpoint: string, extra: Record<string, string>): Promise<Record<string, string> | null> {
  const qs = new URLSearchParams({
    serviceKey: kmaKey(),
    dataType: 'JSON',
    numOfRows: '30',
    pageNo: '1',
    ...extra,
  })
  const url = `${LIVING_BASE}/${endpoint}?${qs}`
  try {
    const res = await safeFetch(url, { next: { revalidate: 1800 }, timeoutMs: 8000 })
    if (!res.ok) return null
    const json = await res.json()
    if (!resultOk(json)) return null
    return firstItem(json)
  } catch {
    return null
  }
}

function timeCandidates(): string[] {
  const { ymd, hour } = kstWallClock()
  const out: string[] = []
  for (let back = 0; back < 8; back++) {
    const h = hour - back
    if (h < 0) break
    out.push(`${ymd}${String(h).padStart(2, '0')}`)
  }
  return out
}

export interface LivingIndexValue {
  value: number
  grade?: string
  raw?: Record<string, string>
}

export interface LivingWeatherBundle {
  uv: LivingIndexValue | null
  /** 여름철 세분 체감온도(도로 등) */
  senTa: LivingIndexValue | null
  /** 겨울철 체감온도 */
  wct: LivingIndexValue | null
  /** 대기정체지수 */
  airDiffusion: LivingIndexValue | null
}

async function tryTimes(
  endpoint: string,
  buildExtra: (time: string) => Record<string, string>,
): Promise<Record<string, string> | null> {
  for (const t of timeCandidates()) {
    const row = await callLiving(endpoint, buildExtra(t))
    if (row && Object.keys(row).length) return row
  }
  return null
}

/**
 * areaNo: 행정동 코드 10자리 (resolveAreaNoByCoords)
 * 도로 환경(A47) 세분 체감 — 일반 실외 활동 프록시
 */
export async function fetchLivingWeatherBundle(areaNo: string): Promise<LivingWeatherBundle> {
  const [uvRow, senRow, wctRow, airRow] = await Promise.all([
    tryTimes('getUVIdxV4', (time) => ({ areaNo, time })),
    tryTimes('getSenTaIdxV4', (time) => ({ areaNo, time, requestCode: 'A47' })),
    tryTimes('getWctIdxV4', (time) => ({ areaNo, time })),
    tryTimes('getAirDiffusionIdxV4', (time) => ({ areaNo, time })),
  ])

  function pack(row: Record<string, string> | null, valueKeys: string[]): LivingIndexValue | null {
    if (!row) return null
    for (const k of valueKeys) {
      if (row[k] !== undefined) {
        const n = parseFloat(String(row[k]))
        if (Number.isFinite(n)) {
          return { value: n, grade: gradeFromRow(row, k), raw: row }
        }
      }
    }
    const n = firstForecastNumber(row)
    if (n == null) return null
    return { value: n, raw: row }
  }

  return {
    uv: pack(uvRow, ['uv', 'uvIdx', 'UV', 'today']),
    senTa: pack(senRow, ['senTa', 'ta', 'temperature', 'max']),
    wct: pack(wctRow, ['wct', 'WCT', 'tw', 'temperature']),
    airDiffusion: pack(airRow, ['airDiffusion', 'diffusion', 'value', 'idx']),
  }
}

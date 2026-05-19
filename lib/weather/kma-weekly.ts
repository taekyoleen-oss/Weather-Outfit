import type { DailyForecast, SkyCode, PtyCode } from '@/types/weather'
import { addCalendarDaysFromKstYmd, kstTodayYmd } from '@/lib/utils/timeOfDay'
import { safeFetch } from '@/lib/utils/safeFetch'

const KMA_BASE = 'http://apis.data.go.kr/1360000/MidFcstInfoService'

let _kmaKey: string | null = null
function kmaKey(): string {
  if (_kmaKey !== null) return _kmaKey
  const raw = process.env.KMA_API_KEY
  if (!raw) throw new Error('KMA_API_KEY not set')
  try { _kmaKey = decodeURIComponent(raw) } catch { _kmaKey = raw }
  return _kmaKey
}

// KST = UTC+9; KMA API uses Korean Standard Time
function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

/** getMidTa JSON: taMin3/taMax3 … 또는 taMin4부터만 제공되는 경우 모두 수집 */
function midTaPairs(row: Record<string, unknown> | null | undefined): Map<number, { min: number; max: number }> {
  const map = new Map<number, { min: number; max: number }>()
  if (!row) return map
  for (const [key, raw] of Object.entries(row)) {
    const m = /^taMin(\d+)$/.exec(key)
    if (!m) continue
    const idx = parseInt(m[1], 10)
    const maxRaw = row[`taMax${idx}`]
    const min = typeof raw === 'number' ? raw : parseFloat(String(raw))
    const max = typeof maxRaw === 'number' ? maxRaw : parseFloat(String(maxRaw))
    if (Number.isFinite(min) && Number.isFinite(max)) map.set(idx, { min, max })
  }
  return map
}

/** 중기 5일: API 키 번호와 달력(오늘+3일~+7일) 정렬 */
function buildMidRows(
  taMap: Map<number, { min: number; max: number }>
): { calendarPlus: number; taKey: number }[] {
  if (!taMap.size) {
    return [3, 4, 5, 6, 7].map((calendarPlus) => ({ calendarPlus, taKey: calendarPlus }))
  }
  if (taMap.has(3)) {
    return [3, 4, 5, 6, 7].map((calendarPlus) => ({ calendarPlus, taKey: calendarPlus }))
  }
  if (taMap.has(4)) {
    return [3, 4, 5, 6, 7].map((calendarPlus, j) => ({ calendarPlus, taKey: 4 + j }))
  }
  const keys = [...taMap.keys()].sort((a, b) => a - b).slice(0, 5)
  return keys.map((taKey, j) => ({ calendarPlus: 3 + j, taKey }))
}

// getMidTa uses temperature forecast region codes (기온예보구역코드), different from land forecast region codes
function getMidTaCode(regId: string): string {
  const MAP: Record<string, string> = {
    '11B00000': '11B10101', // 서울
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

// Map nx/ny approximate region to KMA mid-forecast region code.
// 조건을 disjoint하게 정의해 첫 매칭 우선 규칙에서도 모든 도가 도달 가능하도록 함.
export function getMidRegionCode(nx: number, ny: number): string {
  // 제주: 최남단 독립 도서
  if (nx >= 50 && nx <= 62 && ny >= 50 && ny <= 68) return '11G00000'
  // 강원: 동부 + 높은 ny (nx≥80 이면서 ny≥128)
  if (nx >= 80 && ny >= 128) return '11D10000'
  // 부산/경남: 동남부 저지대 (nx≥83, ny≤100)
  if (nx >= 83 && ny <= 100) return '11H20000'
  // 대구/경북: 동부 중간 (nx≥80, ny 88-127) — 강원·경남 제외 후 나머지
  if (nx >= 80 && ny >= 88 && ny <= 127) return '11H10000'
  // 전남/광주: 서남부 (nx≤80, ny≤100)
  if (nx <= 80 && ny <= 100) return '11F20000'
  // 전북: 서부 중간 (nx≤78, ny 101-118)
  if (nx <= 78 && ny >= 101 && ny <= 118) return '11F10000'
  // 충북: 중부 (nx≥68, ny 112-132)
  if (nx >= 68 && ny >= 112 && ny <= 132) return '11C10000'
  // 충남: 서부 (nx<68, ny 112-132)
  if (nx < 68 && ny >= 112 && ny <= 132) return '11C20000'
  // 서울/경기: 기본값
  return '11B00000'
}

export async function fetchWeeklyForecast(nx: number, ny: number): Promise<DailyForecast[]> {
  const now = kstNow()
  const kstHour = now.getUTCHours()
  let tmFc: string
  if (kstHour >= 18) {
    tmFc = formatDate(now) + '1800'
  } else if (kstHour >= 6) {
    tmFc = formatDate(now) + '0600'
  } else {
    // 06:00 발표 미완료 → 어제 18:00 폴백
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    tmFc = formatDate(yesterday) + '1800'
  }
  const regId = getMidRegionCode(nx, ny)

  const [landRes, tempRes] = await Promise.allSettled([
    fetchMidLand(regId, tmFc),
    fetchMidTemp(regId, tmFc),
  ])

  const land = landRes.status === 'fulfilled' ? landRes.value : null
  const temp = tempRes.status === 'fulfilled' ? tempRes.value : null
  const taMap = midTaPairs(temp as Record<string, unknown> | null | undefined)
  const baseYmd = kstTodayYmd()
  const rows = buildMidRows(taMap)

  const forecasts: DailyForecast[] = []
  for (const { calendarPlus, taKey } of rows) {
    const dateStr = addCalendarDaysFromKstYmd(baseYmd, calendarPlus)
    const pair = taMap.get(taKey)
    const minTemp = pair?.min ?? 10
    const maxTemp = pair?.max ?? 20

    // AM/PM 분리 — KMA 응답의 wf*Am/PM, rnSt*Am/PM 양쪽 보존
    const wfAm = land?.[`wf${taKey}Am`]
    const wfPm = land?.[`wf${taKey}PM`] ?? land?.[`wf${taKey}Pm`]
    const rnAm = land?.[`rnSt${taKey}Am`]
    const rnPm = land?.[`rnSt${taKey}PM`] ?? land?.[`rnSt${taKey}Pm`]
    const amPopParsed = parseInt(String(rnAm ?? ''), 10)
    const pmPopParsed = parseInt(String(rnPm ?? ''), 10)
    const amPop = Number.isFinite(amPopParsed) ? amPopParsed : undefined
    const pmPop = Number.isFinite(pmPopParsed) ? pmPopParsed : undefined
    const amSkyCode = wfAm ? (skyFromLabel(wfAm) as SkyCode) : undefined
    const pmSkyCode = wfPm ? (skyFromLabel(wfPm) as SkyCode) : undefined
    const amPtyCode = wfAm ? (ptyFromLabel(wfAm) as PtyCode) : undefined
    const pmPtyCode = wfPm ? (ptyFromLabel(wfPm) as PtyCode) : undefined

    // 호환성 — 기존 단일 필드는 둘 중 강수확률이 큰 쪽(또는 가용한 쪽)을 대표값으로
    const popRepresentative = amPop !== undefined && pmPop !== undefined
      ? Math.max(amPop, pmPop)
      : (amPop ?? pmPop ?? 20)
    const skyRepresentative: SkyCode = (amSkyCode === '4' || pmSkyCode === '4')
      ? '4'
      : (amSkyCode === '3' || pmSkyCode === '3')
        ? '3'
        : (amSkyCode ?? pmSkyCode ?? '3')
    const ptyRepresentative: PtyCode = (amPtyCode && amPtyCode !== '0')
      ? amPtyCode
      : (pmPtyCode && pmPtyCode !== '0')
        ? pmPtyCode
        : '0'

    forecasts.push({
      date: dateStr,
      minTemp,
      maxTemp,
      skyCode: skyRepresentative,
      ptyCode: ptyRepresentative,
      pop: popRepresentative,
      amPop,
      pmPop,
      amSkyCode,
      pmSkyCode,
      amPtyCode,
      pmPtyCode,
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
    serviceKey: kmaKey(),
    pageNo: '1',
    numOfRows: '10',
    dataType: 'JSON',
    regId,
    tmFc,
  })
  const res = await safeFetch(`${KMA_BASE}/getMidLandFcst?${params}`, { next: { revalidate: 0 } })
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
    serviceKey: kmaKey(),
    pageNo: '1',
    numOfRows: '10',
    dataType: 'JSON',
    regId: taRegId,
    tmFc,
  })
  const res = await safeFetch(`${KMA_BASE}/getMidTa?${params}`, { next: { revalidate: 0 } })
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

/** KMA mid-forecast 「wf*Am/PM」 라벨 → ptyCode */
function ptyFromLabel(label: string): PtyCode {
  if (label.includes('비/눈') || label.includes('비눈')) return '2'
  if (label.includes('눈')) return '3'
  if (label.includes('소나기')) return '4'
  if (label.includes('비')) return '1'
  return '0'
}

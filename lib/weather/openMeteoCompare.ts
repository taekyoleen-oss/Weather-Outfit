/** 어제 동시간대·오늘 일 최저/최고 (Open-Meteo, API 키 불필요) */
import { safeFetch } from '@/lib/utils/safeFetch'

function kstTodayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function kstHourNow(): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      hour12: false,
    })
      .formatToParts(new Date())
      .find((p) => p.type === 'hour')?.value ?? '0',
    10
  )
}

function pickYesterdaySameHourTemp(
  times: string[],
  temps: number[],
  hourKst: number,
  todayYmd: string
): number | null {
  const needle = `T${String(hourKst).padStart(2, '0')}:`
  const todayStart = `${todayYmd}T00:00`
  let bestTime = ''
  let bestTemp: number | null = null
  for (let i = 0; i < times.length; i++) {
    const t = times[i]
    if (!t.includes(needle)) continue
    if (t >= todayStart) continue
    if (t > bestTime) {
      bestTime = t
      bestTemp = temps[i]
    }
  }
  return bestTemp
}

function todayDailyIndex(dailyTimes: string[], todayYmd: string): number {
  const i = dailyTimes.findIndex((t) => t.startsWith(todayYmd))
  return i >= 0 ? i : 0
}

export interface OpenMeteoDailyCompare {
  yesterdaySameHourTemp: number | null
  todayMin: number | null
  todayMax: number | null
  /** 현재 시각(KST) 자외선 지수 — 기상청 생활기상지수 미가용 시 자외선 소스로 사용 */
  currentUvIndex: number | null
  /** 오늘 자외선 지수 최댓값 */
  todayUvMax: number | null
}

/** 오늘 + 현재 시각(HH)에 해당하는 hourly 인덱스의 값을 반환 */
function pickTodayHourValue(
  times: string[],
  values: number[],
  hourKst: number,
  todayYmd: string
): number | null {
  const needle = `${todayYmd.slice(0, 4)}-${todayYmd.slice(4, 6)}-${todayYmd.slice(6, 8)}T${String(hourKst).padStart(2, '0')}:`
  for (let i = 0; i < times.length; i++) {
    if (times[i].startsWith(needle)) {
      const v = values[i]
      return typeof v === 'number' && Number.isFinite(v) ? v : null
    }
  }
  return null
}

export async function fetchOpenMeteoDailyCompare(lat: number, lon: number): Promise<OpenMeteoDailyCompare> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('hourly', 'temperature_2m,uv_index')
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,uv_index_max')
  url.searchParams.set('past_days', '1')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('timezone', 'Asia/Seoul')

  const empty: OpenMeteoDailyCompare = {
    yesterdaySameHourTemp: null,
    todayMin: null,
    todayMax: null,
    currentUvIndex: null,
    todayUvMax: null,
  }

  const res = await safeFetch(url.toString(), { next: { revalidate: 1800 } })
  if (!res.ok) return empty
  const json = (await res.json()) as {
    hourly?: { time?: string[]; temperature_2m?: number[]; uv_index?: number[] }
    daily?: {
      time?: string[]
      temperature_2m_max?: number[]
      temperature_2m_min?: number[]
      uv_index_max?: number[]
    }
  }

  const times = json.hourly?.time ?? []
  const temps = json.hourly?.temperature_2m ?? []
  const uvs = json.hourly?.uv_index ?? []
  const dailyTime = json.daily?.time ?? []
  const dailyMax = json.daily?.temperature_2m_max ?? []
  const dailyMin = json.daily?.temperature_2m_min ?? []
  const dailyUvMax = json.daily?.uv_index_max ?? []

  const todayYmd = kstTodayYmd()
  const hourKst = kstHourNow()

  const yesterdaySameHourTemp =
    times.length && temps.length
      ? pickYesterdaySameHourTemp(times, temps, hourKst, todayYmd)
      : null

  const di = todayDailyIndex(dailyTime, todayYmd)
  const todayMin = dailyMin[di] ?? null
  const todayMax = dailyMax[di] ?? null
  const todayUvMax = dailyUvMax[di] ?? null

  const currentUvIndex =
    times.length && uvs.length ? pickTodayHourValue(times, uvs, hourKst, todayYmd) : null

  return { yesterdaySameHourTemp, todayMin, todayMax, currentUvIndex, todayUvMax }
}

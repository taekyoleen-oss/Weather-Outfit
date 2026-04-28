/** 어제 동시간대·오늘 일 최저/최고 (Open-Meteo, API 키 불필요) */

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
}

export async function fetchOpenMeteoDailyCompare(lat: number, lon: number): Promise<OpenMeteoDailyCompare> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('hourly', 'temperature_2m')
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min')
  url.searchParams.set('past_days', '1')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('timezone', 'Asia/Seoul')

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } })
  if (!res.ok) {
    return { yesterdaySameHourTemp: null, todayMin: null, todayMax: null }
  }
  const json = (await res.json()) as {
    hourly?: { time?: string[]; temperature_2m?: number[] }
    daily?: {
      time?: string[]
      temperature_2m_max?: number[]
      temperature_2m_min?: number[]
    }
  }

  const times = json.hourly?.time ?? []
  const temps = json.hourly?.temperature_2m ?? []
  const dailyTime = json.daily?.time ?? []
  const dailyMax = json.daily?.temperature_2m_max ?? []
  const dailyMin = json.daily?.temperature_2m_min ?? []

  const todayYmd = kstTodayYmd()
  const hourKst = kstHourNow()

  const yesterdaySameHourTemp =
    times.length && temps.length
      ? pickYesterdaySameHourTemp(times, temps, hourKst, todayYmd)
      : null

  const di = todayDailyIndex(dailyTime, todayYmd)
  const todayMin = dailyMin[di] ?? null
  const todayMax = dailyMax[di] ?? null

  return { yesterdaySameHourTemp, todayMin, todayMax }
}

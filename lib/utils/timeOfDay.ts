import type { TimeOfDay } from '@/types/weather'

function parseHHMM(hhmm: string): number {
  const h = parseInt(hhmm.slice(0, 2), 10)
  const m = parseInt(hhmm.slice(2, 4), 10)
  return h * 60 + m
}

export function getTimeOfDay(hour: number, sunriseHHMM?: string, sunsetHHMM?: string): TimeOfDay {
  const nowMin = hour * 60

  const riseMin = sunriseHHMM ? parseHHMM(sunriseHHMM) : 6 * 60
  const setMin = sunsetHHMM ? parseHHMM(sunsetHHMM) : 18 * 60 + 30

  if (nowMin < riseMin - 30 || nowMin >= setMin + 60) return 'night'
  if (nowMin < riseMin + 60) return 'morning'
  if (nowMin >= setMin - 60) return 'evening'
  return 'day'
}

export function currentHour(): number {
  return new Date().getHours()
}

/** KMA 단기예보와 동일한 기준(한국 표준시) 시각 0–23 */
export function currentHourKst(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '0'
  return parseInt(hourPart, 10)
}

/** KST 기준 달력 날짜 yyyymmdd */
export function kstTodayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/-/g, '')
}

/** KST 달력 yyyymmdd에 일수를 더해 yyyymmdd로 반환 (중기·주간 표시용, UTC 달력 연산) */
export function addCalendarDaysFromKstYmd(ymd: string, deltaDays: number): string {
  const y = parseInt(ymd.slice(0, 4), 10)
  const m = parseInt(ymd.slice(4, 6), 10) - 1
  const d = parseInt(ymd.slice(6, 8), 10)
  const u = Date.UTC(y, m, d + deltaDays)
  const nd = new Date(u)
  return `${nd.getUTCFullYear()}${String(nd.getUTCMonth() + 1).padStart(2, '0')}${String(nd.getUTCDate()).padStart(2, '0')}`
}

/** fromYmd → toYmd 일수 차이 (to가 미래면 양수). UTC 달력 기준. */
export function diffCalendarDaysYmd(fromYmd: string, toYmd: string): number {
  const y1 = parseInt(fromYmd.slice(0, 4), 10)
  const m1 = parseInt(fromYmd.slice(4, 6), 10) - 1
  const d1 = parseInt(fromYmd.slice(6, 8), 10)
  const y2 = parseInt(toYmd.slice(0, 4), 10)
  const m2 = parseInt(toYmd.slice(4, 6), 10) - 1
  const d2 = parseInt(toYmd.slice(6, 8), 10)
  const u1 = Date.UTC(y1, m1, d1)
  const u2 = Date.UTC(y2, m2, d2)
  return Math.round((u2 - u1) / 86400000)
}

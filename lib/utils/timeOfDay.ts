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

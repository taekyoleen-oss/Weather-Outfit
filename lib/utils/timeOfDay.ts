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

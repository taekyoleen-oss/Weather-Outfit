import type { HourlyForecast } from '@/types/weather'

export interface TimePeriod {
  id: string
  label: string
  emoji: string
  repHour: number
  start: number
  end: number
}

export const TIME_PERIODS: TimePeriod[] = [
  { id: 'dawn',      label: '새벽', emoji: '🌙', repHour: 4,  start: 0,  end: 5  },
  { id: 'morning',   label: '오전', emoji: '🌅', repHour: 9,  start: 6,  end: 11 },
  { id: 'afternoon', label: '오후', emoji: '🌤', repHour: 14, start: 12, end: 17 },
  { id: 'evening',   label: '저녁', emoji: '🌇', repHour: 19, start: 18, end: 23 },
]

export function getPeriodIndex(hour: number): number {
  if (hour <= 5) return 0
  if (hour <= 11) return 1
  if (hour <= 17) return 2
  return 3
}

/**
 * 오전(6~12시)일 때는 오전 전체가 보이도록 6시부터 시작.
 * 오후/저녁은 현재 시각부터 시작.
 */
export function samePeriodHourlySliceFloor(currentHourKst: number, _currentPeriodIdx: number): number {
  if (currentHourKst <= TIME_PERIODS[1].end) return TIME_PERIODS[1].start
  return currentHourKst
}

function hourNum(t: string): number {
  return parseInt(t.split(':')[0], 10)
}

/**
 * 오후 전(KST): 같은 일자 블록 안에서 오전(6~12시)을 맨 앞에 배치.
 * 자정 넘김이 있으면 자정 **이전** 구간만 재배열하고 이후는 순서 유지.
 */
export function orderHourlyStripBeforeNoon(list: HourlyForecast[], hourKst: number): HourlyForecast[] {
  if (hourKst >= 12 || list.length <= 1) return list

  const midnight = list.findIndex((h, i) => i > 0 && hourNum(h.time) < hourNum(list[i - 1].time))
  if (midnight >= 0) {
    return [...orderBeforeNoonSegment(list.slice(0, midnight)), ...list.slice(midnight)]
  }
  return orderBeforeNoonSegment(list)
}

function orderBeforeNoonSegment(seg: HourlyForecast[]): HourlyForecast[] {
  if (seg.length <= 1) return seg
  const morning: HourlyForecast[] = []
  const hi: HourlyForecast[] = []
  const lo: HourlyForecast[] = []
  for (const h of seg) {
    const n = hourNum(h.time)
    if (n >= 6 && n <= 11) morning.push(h)
    else if (n >= 12) hi.push(h)
    else lo.push(h)
  }
  const byH = (a: HourlyForecast, b: HourlyForecast) => hourNum(a.time) - hourNum(b.time)
  morning.sort(byH)
  hi.sort(byH)
  lo.sort(byH)
  return [...morning, ...hi, ...lo]
}

/** 현재 시각에서 이미 끝난 시간대 중, 종료 시각이 가장 늦은 구간(직전 구간). 새벽 0–5시 등은 전일 저녁 미포함. */
export function getPreviousCompletedPeriod(currentHourKst: number): TimePeriod | null {
  let best: TimePeriod | null = null
  for (const p of TIME_PERIODS) {
    if (p.end < currentHourKst && (!best || p.end > best.end)) best = p
  }
  return best
}

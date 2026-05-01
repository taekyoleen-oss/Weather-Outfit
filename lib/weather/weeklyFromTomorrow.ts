import type { DailyForecast, HourlyForecast } from '@/types/weather'

/** 단기 hourly를 날짜별로 묶어 오늘(KST) 이후 일별 요약을 만든다. */
export function buildDailyFromHourlyAfterToday(
  hourly: HourlyForecast[],
  todayYmd: string,
): DailyForecast[] {
  const byDate = new Map<string, HourlyForecast[]>()
  for (const h of hourly) {
    const ymd = h.fcstDate
    if (!ymd || ymd <= todayYmd) continue
    const arr = byDate.get(ymd) ?? []
    arr.push(h)
    byDate.set(ymd, arr)
  }

  const result: DailyForecast[] = []
  for (const date of [...byDate.keys()].sort()) {
    const slots = byDate.get(date)!
    const temps = slots.map((s) => s.temperature)
    const minTemp = Math.min(...temps)
    const maxTemp = Math.max(...temps)
    const pop = Math.max(0, ...slots.map((s) => s.pop))
    const rep = slots.reduce((best, s) => {
      const hour = parseInt(s.time.slice(0, 2), 10)
      const bestHour = parseInt(best.time.slice(0, 2), 10)
      return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? s : best
    }, slots[0]!)
    const sortedSlots = [...slots].sort((a, b) => a.time.localeCompare(b.time))
    result.push({
      date,
      minTemp,
      maxTemp,
      skyCode: rep.skyCode,
      ptyCode: rep.ptyCode,
      pop,
      hourly: sortedSlots,
    })
  }
  return result
}

/**
 * 주간 탭: KST 기준 **내일(오늘 제외)**부터만 표시.
 * - 단기 hourly로 내일·글피 등 근접 일자 채움
 * - 중기 일별은 오늘 이후만 두고, 같은 날짜는 단기 요약을 우선
 */
export function mergeWeeklyDailyStartingTomorrow(
  midTermDaily: DailyForecast[],
  hourly: HourlyForecast[],
  todayYmd: string,
): DailyForecast[] {
  const shortTerm = buildDailyFromHourlyAfterToday(hourly, todayYmd)
  const midFiltered = midTermDaily.filter((d) => d.date > todayYmd)
  const byDate = new Map<string, DailyForecast>()
  for (const d of midFiltered) {
    byDate.set(d.date, d)
  }
  for (const d of shortTerm) {
    byDate.set(d.date, d)
  }
  return [...byDate.keys()].sort().map((k) => byDate.get(k)!)
}

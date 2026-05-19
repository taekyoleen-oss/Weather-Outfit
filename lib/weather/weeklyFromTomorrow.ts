import type { DailyForecast, HourlyForecast, SkyCode, PtyCode } from '@/types/weather'

/** 단기 hourly를 날짜별로 묶어 오늘(KST) 이후 일별 요약을 만든다. */
export function buildDailyFromHourlyAfterToday(
  hourly: HourlyForecast[],
  todayYmd: string,
): DailyForecast[] {
  return buildDailyFromHourly(hourly, todayYmd, /* includeToday */ false)
}

/** 단기 hourly를 날짜별로 묶어 오늘 포함/제외 옵션으로 일별 요약을 만든다. AM/PM 분리 필드도 채움. */
function buildDailyFromHourly(
  hourly: HourlyForecast[],
  todayYmd: string,
  includeToday: boolean,
): DailyForecast[] {
  const byDate = new Map<string, HourlyForecast[]>()
  for (const h of hourly) {
    const ymd = h.fcstDate
    if (!ymd) continue
    if (includeToday ? ymd < todayYmd : ymd <= todayYmd) continue
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

    // AM(07~12시) / PM(13~18시) 세그먼트 분할
    const amSlots = slots.filter((s) => {
      const h = parseInt(s.time.slice(0, 2), 10)
      return h >= 7 && h <= 12
    })
    const pmSlots = slots.filter((s) => {
      const h = parseInt(s.time.slice(0, 2), 10)
      return h >= 13 && h <= 18
    })
    const amPop = amSlots.length > 0 ? Math.max(0, ...amSlots.map((s) => s.pop)) : undefined
    const pmPop = pmSlots.length > 0 ? Math.max(0, ...pmSlots.map((s) => s.pop)) : undefined
    // 중앙(10~11, 14~15)에 가장 가까운 슬롯의 sky/pty를 대표값으로
    const amRep = amSlots.length > 0
      ? amSlots.reduce((best, s) => {
          const h = parseInt(s.time.slice(0, 2), 10)
          const bestH = parseInt(best.time.slice(0, 2), 10)
          return Math.abs(h - 10) < Math.abs(bestH - 10) ? s : best
        }, amSlots[0]!)
      : null
    const pmRep = pmSlots.length > 0
      ? pmSlots.reduce((best, s) => {
          const h = parseInt(s.time.slice(0, 2), 10)
          const bestH = parseInt(best.time.slice(0, 2), 10)
          return Math.abs(h - 14) < Math.abs(bestH - 14) ? s : best
        }, pmSlots[0]!)
      : null

    result.push({
      date,
      minTemp,
      maxTemp,
      skyCode: rep.skyCode,
      ptyCode: rep.ptyCode,
      pop,
      hourly: sortedSlots,
      amPop,
      pmPop,
      amSkyCode: amRep?.skyCode as SkyCode | undefined,
      pmSkyCode: pmRep?.skyCode as SkyCode | undefined,
      amPtyCode: amRep?.ptyCode as PtyCode | undefined,
      pmPtyCode: pmRep?.ptyCode as PtyCode | undefined,
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

/**
 * 모바일 주간예보 탭 — **오늘 포함** 최대 8일(today+7).
 * - 오늘·내일·+2일은 단기 hourly에서 AM/PM·min/max를 정확히 집계
 * - +3일 이후는 KMA 중기예보(이미 AM/PM 분리 보존)를 사용
 * - 같은 날짜에 단기·중기가 모두 있으면 단기를 기본으로 하되,
 *   AM/PM 슬롯이 비어 있는 필드는 mid의 값으로 채워 「+3일 경계 부분 hourly」가 mid 데이터를 가리지 않도록 한다.
 */
export function mergeWeeklyDailyFromToday(
  midTermDaily: DailyForecast[],
  hourly: HourlyForecast[],
  todayYmd: string,
): DailyForecast[] {
  const shortTerm = buildDailyFromHourly(hourly, todayYmd, /* includeToday */ true)
  const midFiltered = midTermDaily.filter((d) => d.date >= todayYmd)
  const byDate = new Map<string, DailyForecast>()
  for (const d of midFiltered) {
    byDate.set(d.date, d)
  }
  for (const d of shortTerm) {
    const mid = byDate.get(d.date)
    if (!mid) {
      byDate.set(d.date, d)
      continue
    }
    // 필드 단위 머지 — shortTerm 값 우선, 없으면 mid 값으로 폴백
    byDate.set(d.date, {
      ...d,
      amPop: d.amPop ?? mid.amPop,
      pmPop: d.pmPop ?? mid.pmPop,
      amSkyCode: d.amSkyCode ?? mid.amSkyCode,
      pmSkyCode: d.pmSkyCode ?? mid.pmSkyCode,
      amPtyCode: d.amPtyCode ?? mid.amPtyCode,
      pmPtyCode: d.pmPtyCode ?? mid.pmPtyCode,
    })
  }
  return [...byDate.keys()].sort().slice(0, 8).map((k) => byDate.get(k)!)
}

import { addCalendarDaysFromKstYmd, diffCalendarDaysYmd, kstTodayYmd } from '@/lib/utils/timeOfDay'
import { TIME_PERIODS, getPeriodIndex } from '@/lib/utils/timePeriods'

export interface VisitScheduleShape {
  /** KST 관심 조회일 yyyymmdd (임의 날짜, 저장 유지) */
  visitDateYmd: string
  startHour: number
  endHour: number
}

/** 앱 전역 관심 일정 — 외출옷 탭은 start/end(시간대) 유지 */
export type VisitSchedule = VisitScheduleShape

/** 저장값이 표준 구간과 다르면 시작 시각이 속한 시간대로 스냅 */
export function snapScheduleToPeriodBounds(s: VisitScheduleShape): VisitScheduleShape {
  const exact = TIME_PERIODS.find((p) => p.start === s.startHour && p.end === s.endHour)
  if (exact) return s
  const i = getPeriodIndex(Math.min(Math.max(s.startHour, 0), 23))
  const p = TIME_PERIODS[i]!
  return { ...s, startHour: p.start, endHour: p.end }
}

/** 시간대별 대표 시각(시간별 예보 슬롯 선택용) */
export function repHourForVisitSchedule(s: VisitScheduleShape): number {
  const m = TIME_PERIODS.find((p) => p.start === s.startHour && p.end === s.endHour)
  return m?.repHour ?? s.startHour
}

export function defaultVisitSchedule(nowHour: number): VisitScheduleShape {
  const i = getPeriodIndex(nowHour)
  const p = TIME_PERIODS[i]!
  return {
    visitDateYmd: kstTodayYmd(),
    startHour: p.start,
    endHour: p.end,
  }
}

/** localStorage 구형 `{ dateOffset }` → 절대 날짜 */
export function migrateLegacyVisitSchedule(raw: unknown, todayYmd: string): VisitScheduleShape | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const start = typeof o.startHour === 'number' ? o.startHour : 9
  const end = typeof o.endHour === 'number' ? o.endHour : 17
  if (typeof o.visitDateYmd === 'string' && /^\d{8}$/.test(o.visitDateYmd)) {
    return snapScheduleToPeriodBounds({
      visitDateYmd: o.visitDateYmd,
      startHour: start,
      endHour: end,
    })
  }
  if (typeof o.dateOffset === 'number') {
    const off = Math.min(2, Math.max(0, Math.floor(o.dateOffset))) as 0 | 1 | 2
    return snapScheduleToPeriodBounds({
      visitDateYmd: addCalendarDaysFromKstYmd(todayYmd, off),
      startHour: start,
      endHour: end,
    })
  }
  return null
}

/**
 * 형식 보정·과거 날짜는 오늘로 올림·당일이면 이미 지난 시간대만 현재 구간으로 갱신.
 * 미래 날짜는 유지합니다.
 */
export function normalizeVisitScheduleIfPast(
  s: VisitScheduleShape,
  todayYmd: string,
  nowHour: number,
): VisitScheduleShape {
  let next = snapScheduleToPeriodBounds(s)
  if (!/^\d{8}$/.test(next.visitDateYmd)) {
    return defaultVisitSchedule(nowHour)
  }
  if (diffCalendarDaysYmd(todayYmd, next.visitDateYmd) < 0) {
    next = { ...next, visitDateYmd: todayYmd }
  }
  if (next.visitDateYmd === todayYmd && next.endHour <= nowHour) {
    const i = getPeriodIndex(nowHour)
    const p = TIME_PERIODS[i]!
    return { ...next, startHour: p.start, endHour: p.end }
  }
  return next
}

export function schedulesEqual(a: VisitScheduleShape, b: VisitScheduleShape): boolean {
  return (
    a.visitDateYmd === b.visitDateYmd &&
    a.startHour === b.startHour &&
    a.endHour === b.endHour
  )
}

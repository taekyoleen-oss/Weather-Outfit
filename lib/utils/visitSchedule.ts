import { addCalendarDaysFromKstYmd, kstTodayYmd } from '@/lib/utils/timeOfDay'

export interface VisitScheduleShape {
  dateOffset: 0 | 1 | 2
  startHour: number
  endHour: number
}

/** 앱 전역 관심 일정 (page·InterestLocationCard·OutfitPanel) */
export type VisitSchedule = VisitScheduleShape

/** 시작 시각 기준 종료 = min(시작+4, 23) */
export function endHourFromStart(startHour: number): number {
  return Math.min(startHour + 4, 23)
}

export function defaultVisitSchedule(nowHour: number): VisitScheduleShape {
  const start = Math.min(Math.max(nowHour, 0), 23)
  return {
    dateOffset: 0,
    startHour: start,
    endHour: Math.max(endHourFromStart(start), Math.min(start + 1, 23)),
  }
}

/** 관심 일정이 이미 지났으면 오늘·현재 시각 기준으로 되돌림 */
export function normalizeVisitScheduleIfPast(
  s: VisitScheduleShape,
  todayYmd: string,
  nowHour: number,
): VisitScheduleShape {
  const visitYmd = addCalendarDaysFromKstYmd(todayYmd, s.dateOffset)
  if (visitYmd < todayYmd) {
    return defaultVisitSchedule(nowHour)
  }
  if (visitYmd > todayYmd) {
    return s
  }
  if (s.endHour <= nowHour) {
    return defaultVisitSchedule(nowHour)
  }
  return s
}

export function schedulesEqual(a: VisitScheduleShape, b: VisitScheduleShape): boolean {
  return a.dateOffset === b.dateOffset && a.startHour === b.startHour && a.endHour === b.endHour
}

/** 같은 날 안에서 시작 시각을 ±시간 이동 — 종료는 시작+4h(캡 23) */
export function shiftVisitScheduleHours(s: VisitSchedule, delta: number): VisitSchedule {
  const start = Math.max(0, Math.min(23, s.startHour + delta))
  let end = Math.min(start + 4, 23)
  if (end <= start) end = Math.min(start + 1, 23)
  return { ...s, startHour: start, endHour: end }
}

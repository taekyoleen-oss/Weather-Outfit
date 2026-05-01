import type { HourlyForecast } from '@/types/weather'
import type { TimePeriod } from '@/lib/utils/timePeriods'
import { addCalendarDaysFromKstYmd, kstTodayYmd } from '@/lib/utils/timeOfDay'

function resolveSlotYmd(
  h: HourlyForecast,
  todayYmd: string,
  prevYmd: string | null,
  prevHour: number | null,
): string {
  if (h.fcstDate) return h.fcstDate
  if (prevYmd === null) return todayYmd
  if (prevHour === null) return prevYmd
  const curH = parseInt(h.time.split(':')[0], 10)
  return curH < prevHour ? addCalendarDaysFromKstYmd(prevYmd, 1) : prevYmd
}

export function buildHourlySlotYmds(hourly: HourlyForecast[], todayYmd: string = kstTodayYmd()): string[] {
  const slotYmds: string[] = []
  let prevYmd: string | null = null
  let prevHour: number | null = null
  for (let i = 0; i < hourly.length; i++) {
    const ymd = resolveSlotYmd(hourly[i], todayYmd, prevYmd, prevHour)
    slotYmds.push(ymd)
    prevYmd = ymd
    prevHour = parseInt(hourly[i].time.split(':')[0], 10)
  }
  return slotYmds
}

function findAtHour(
  hourNum: number,
  targetYmd: string,
  hourly: HourlyForecast[],
  slotYmds: string[],
): HourlyForecast | undefined {
  const timeStr = String(hourNum).padStart(2, '0') + ':00'
  const idx = hourly.findIndex((h, i) => h.time === timeStr && slotYmds[i] === targetYmd)
  return idx >= 0 ? hourly[idx] : undefined
}

/**
 * 특정 KST 날짜(yyyymmdd) + 시간대(새벽/오전/…)에 맞는 시간별 슬롯 선택.
 * 대표 시각(repHour)이 없으면 구간 시작·구간 내 임의 슬롯으로 폴백하며 ambiguous 표시.
 */
export function resolveHourlyForYmdBand(
  hourly: HourlyForecast[],
  targetYmd: string,
  period: TimePeriod,
  todayYmd: string = kstTodayYmd(),
): { entry?: HourlyForecast; ambiguous: boolean } {
  if (!hourly.length) return { entry: undefined, ambiguous: true }
  const slotYmds = buildHourlySlotYmds(hourly, todayYmd)

  const exact = findAtHour(period.repHour, targetYmd, hourly, slotYmds)
  if (exact) return { entry: exact, ambiguous: false }

  const atStart = findAtHour(period.start, targetYmd, hourly, slotYmds)
  if (atStart) return { entry: atStart, ambiguous: true }

  const inBand: HourlyForecast[] = []
  for (let i = 0; i < hourly.length; i++) {
    if (slotYmds[i] !== targetYmd) continue
    const t = parseInt(hourly[i].time.split(':')[0], 10)
    if (t >= period.start && t <= period.end) inBand.push(hourly[i])
  }
  if (inBand.length) {
    return { entry: inBand[Math.floor(inBand.length / 2)], ambiguous: true }
  }

  const anyDay = hourly.find((_, i) => slotYmds[i] === targetYmd)
  return { entry: anyDay, ambiguous: true }
}

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
  { id: 'morning',   label: '아침', emoji: '🌅', repHour: 8,  start: 6,  end: 10 },
  { id: 'noon',      label: '정오', emoji: '☀️', repHour: 12, start: 11, end: 13 },
  { id: 'afternoon', label: '오후', emoji: '🌤', repHour: 15, start: 14, end: 17 },
  { id: 'evening',   label: '저녁', emoji: '🌇', repHour: 19, start: 18, end: 23 },
]

export function getPeriodIndex(hour: number): number {
  if (hour <= 5) return 0
  if (hour <= 10) return 1
  if (hour <= 13) return 2
  if (hour <= 17) return 3
  return 4
}

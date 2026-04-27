import type { SkyCode, PtyCode, DustGrade, IllustKey, TimeOfDay } from '@/types/weather'

export function skyLabel(sky: SkyCode): string {
  const MAP: Record<SkyCode, string> = {
    '1': '맑음',
    '3': '구름 많음',
    '4': '흐림',
  }
  return MAP[sky] ?? '맑음'
}

export function ptyLabel(pty: PtyCode): string {
  const MAP: Record<PtyCode, string> = {
    '0': '',
    '1': '비',
    '2': '비/눈',
    '3': '눈',
    '4': '소나기',
  }
  return MAP[pty] ?? ''
}

export function weatherLabel(sky: SkyCode, pty: PtyCode): string {
  if (pty !== '0') return ptyLabel(pty)
  return skyLabel(sky)
}

export function uvLabel(uvi: number): string {
  if (uvi <= 2) return '낮음'
  if (uvi <= 5) return '보통'
  if (uvi <= 7) return '높음'
  if (uvi <= 10) return '매우 높음'
  return '위험'
}

export function uvColor(uvi: number): string {
  if (uvi <= 2) return '#22C55E'
  if (uvi <= 5) return '#FFB547'
  if (uvi <= 7) return '#F59E0B'
  if (uvi <= 10) return '#EF4444'
  return '#7C3AED'
}

export function dustGradeLabel(grade: string): string {
  const MAP: Record<string, string> = {
    '1': '좋음',
    '2': '보통',
    '3': '나쁨',
    '4': '매우나쁨',
    good: '좋음',
    normal: '보통',
    bad: '나쁨',
    very_bad: '매우나쁨',
  }
  return MAP[grade] ?? '보통'
}

export function dustGradeColor(grade: string): string {
  const MAP: Record<string, string> = {
    '1': '#22C55E',
    '2': '#5B8DEE',
    '3': '#F59E0B',
    '4': '#EF4444',
    good: '#22C55E',
    normal: '#5B8DEE',
    bad: '#F59E0B',
    very_bad: '#EF4444',
  }
  return MAP[grade] ?? '#5B8DEE'
}

export function o3GradeLabel(grade: string | undefined): string {
  const MAP: Record<string, string> = { '1': '좋음', '2': '보통', '3': '나쁨', '4': '매우나쁨' }
  return grade ? (MAP[grade] ?? '보통') : '--'
}

export function o3GradeColor(grade: string | undefined): string {
  const MAP: Record<string, string> = { '1': '#22C55E', '2': '#5B8DEE', '3': '#F59E0B', '4': '#EF4444' }
  return grade ? (MAP[grade] ?? '#5B8DEE') : 'var(--muted)'
}

export function feelsLike(temp: number, windSpeed: number, humidity: number): number {
  if (temp <= 10) {
    // Wind Chill
    if (windSpeed < 1.3) return temp
    const v = Math.pow(windSpeed * 3.6, 0.16)
    return Math.round(13.12 + 0.6215 * temp - 11.37 * v + 0.3965 * temp * v)
  }
  if (temp >= 27) {
    // Heat Index
    const T = temp
    const R = humidity
    let hi = -8.78469475556 + 1.61139411 * T + 2.3385348 * R - 0.14611605 * T * R
    hi -= 0.012308094 * T * T - 0.016424828 * R * R + 0.002211732 * T * T * R
    hi += 0.00072546 * T * R * R - 0.000003582 * T * T * R * R
    return Math.round(hi)
  }
  return temp
}

const SKY_ILLUST: Record<SkyCode, IllustKey> = {
  '1': 'clear',
  '3': 'partly',
  '4': 'mostly-cloudy',
}

const PTY_ILLUST: Record<PtyCode, IllustKey | null> = {
  '0': null,
  '1': 'rain',
  '2': 'rain-snow',
  '3': 'snow',
  '4': 'shower',
}

export function pickIllustKey(sky: SkyCode, pty: PtyCode): IllustKey {
  if (pty !== '0') return PTY_ILLUST[pty] ?? 'cloudy'
  return SKY_ILLUST[sky] ?? 'clear'
}

export function illustFile(key: IllustKey, period: TimeOfDay): string {
  const nightKeys: IllustKey[] = ['clear', 'partly']
  if (period === 'night' && nightKeys.includes(key)) return 'clear-night'
  if (period === 'evening' && key === 'clear') return 'sunny-evening'
  if (period === 'morning' && key === 'clear') return 'sunny-day'
  if (key === 'clear') return 'sunny-day'
  if (key === 'partly') return `partly-${period === 'night' ? 'day' : period === 'morning' ? 'day' : 'day'}`
  if (key === 'mostly-cloudy') return 'mostly-cloudy-day'
  if (key === 'cloudy') return 'cloudy-day'
  if (key === 'rain') return period === 'evening' ? 'rain-evening' : 'rain-day'
  if (key === 'snow') return 'snow-day'
  if (key === 'fog') return 'fog-day'
  if (key === 'storm') return 'storm-day'
  if (key === 'shower') return 'rain-day'
  if (key === 'rain-snow') return 'snow-day'
  return 'sunny-day'
}

export function windDirectionLabel(deg: number): string {
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return dirs[Math.round(deg / 45) % 8]
}

export function formatTime(hhmm: string): string {
  const h = parseInt(hhmm.slice(0, 2), 10)
  const m = hhmm.slice(2, 4)
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 || 12
  return `${ampm} ${h12}:${m}`
}

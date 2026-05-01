/**
 * 골프 라운드 적합도 점수 (0~100). 기상청 공식 "골프지수"는 없어
 * activityGuides 골프 리스크 기준에 맞춘 가중 규칙.
 */

export type GolfGrade = 'good' | 'fair' | 'caution' | 'avoid'

export interface GolfScoreReason {
  key: string
  impact: number
  label: string
}

export interface GolfScoreInput {
  tempC: number
  feelsLikeC: number
  windSpeedMs: number
  pop: number
  rn1mm: number
  ptyCode: string
  uvIndex: number
  visibilityKm: number | null
  hasLightningAlert: boolean
}

export interface GolfScore {
  score: number
  grade: GolfGrade
  reasons: GolfScoreReason[]
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function computeGolfScore(input: GolfScoreInput): GolfScore {
  const reasons: GolfScoreReason[] = []
  let penalty = 0

  if (input.hasLightningAlert) {
    reasons.push({ key: 'lightning', impact: -100, label: '낙뢰·기상특보: 즉시 라운드 중단 권고' })
    penalty += 100
  }

  const pty = input.ptyCode
  if (pty === '4') {
    reasons.push({ key: 'shower', impact: -45, label: '소나기 예보: 낙뢰 위험' })
    penalty += 45
  } else if (input.rn1mm >= 1 || (pty === '1' && input.rn1mm >= 0.5)) {
    reasons.push({ key: 'rain', impact: -28, label: '강수: 우천·그린 컨디션 악화' })
    penalty += 28
  }

  const w = input.windSpeedMs
  if (w >= 14) {
    reasons.push({ key: 'wind14', impact: -55, label: `강풍 (${w.toFixed(1)}m/s): 스윙·카트 주의` })
    penalty += 55
  } else if (w >= 7) {
    reasons.push({ key: 'wind7', impact: -22, label: `다소 강한 바람 (${w.toFixed(1)}m/s)` })
    penalty += 22
  } else if (w >= 5) {
    reasons.push({ key: 'wind5', impact: -10, label: `바람 다소 강함 (${w.toFixed(1)}m/s)` })
    penalty += 10
  }

  const pop = input.pop
  if (pop >= 70) {
    reasons.push({ key: 'pop70', impact: -38, label: `강수확률 ${pop}%` })
    penalty += 38
  } else if (pop >= 40) {
    reasons.push({ key: 'pop40', impact: -18, label: `강수확률 ${pop}%` })
    penalty += 18
  } else if (pop >= 20) {
    reasons.push({ key: 'pop20', impact: -6, label: `강수확률 ${pop}%` })
    penalty += 6
  }

  if (input.uvIndex >= 8) {
    reasons.push({ key: 'uv8', impact: -12, label: `자외선 매우 높음 (UV ${input.uvIndex})` })
    penalty += 12
  } else if (input.uvIndex >= 6) {
    reasons.push({ key: 'uv6', impact: -6, label: `자외선 높음 (UV ${input.uvIndex})` })
    penalty += 6
  }

  if (input.feelsLikeC >= 33) {
    reasons.push({ key: 'heat', impact: -28, label: `폭염 체감 (${input.feelsLikeC.toFixed(1)}°)` })
    penalty += 28
  } else if (input.feelsLikeC <= 0) {
    reasons.push({ key: 'cold', impact: -18, label: `저체감 (${input.feelsLikeC.toFixed(1)}°)` })
    penalty += 18
  }

  if (input.visibilityKm != null && input.visibilityKm < 1) {
    reasons.push({ key: 'fog', impact: -32, label: '시정 불량(안개): 시야·샷 판단 어려움' })
    penalty += 32
  }

  const raw = 100 - penalty
  const score = clamp(Math.round(raw), 0, 100)

  let grade: GolfGrade
  if (score >= 80) grade = 'good'
  else if (score >= 60) grade = 'fair'
  else if (score >= 40) grade = 'caution'
  else grade = 'avoid'

  reasons.sort((a, b) => a.impact - b.impact)

  return { score, grade, reasons }
}

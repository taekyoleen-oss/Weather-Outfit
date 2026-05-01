'use client'

import { windDirectionLabel } from '@/lib/utils/formatWeather'
import type { GolfScore } from '@/lib/spot/golfScore'

interface Props {
  windSpeedMs: number
  vecDeg: number
  score: GolfScore
  bestTeeHours: number[]
  compact?: boolean
}

const GRADE_LABEL: Record<GolfScore['grade'], string> = {
  good: '라운드 좋음',
  fair: '양호',
  caution: '주의',
  avoid: '라운드 비권장',
}

const GRADE_COLOR: Record<GolfScore['grade'], string> = {
  good: '#16a34a',
  fair: '#5B8DEE',
  caution: '#F59E0B',
  avoid: '#DC2626',
}

export function FairwayWindCard({ windSpeedMs, vecDeg, score, bestTeeHours, compact = false }: Props) {
  const dir = windDirectionLabel(vecDeg)
  let hint = '바람이 잔잔합니다.'
  if (windSpeedMs >= 7) hint = '바람이 강합니다. 클럽 선택·스윙 템포에 여유를 두세요.'
  else if (windSpeedMs >= 5) hint = '바람이 다소 있습니다. 거리 보정을 고려하세요.'
  const g = score.grade

  return (
    <div
      className={`rounded-2xl ${compact ? 'p-3' : 'p-4'}`}
      style={{
        background: 'var(--card, #fff)',
        border: `2px solid ${GRADE_COLOR[g]}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <p className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--primary)' }}>
        골프 지수
      </p>
      <div className={`mt-2 grid grid-cols-2 ${compact ? 'gap-2' : 'gap-3'}`}>
        <div className="min-w-0 rounded-xl p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
            페어웨이 바람
          </p>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: compact ? 36 : 42,
                height: compact ? 36 : 42,
                background: 'rgba(91,141,238,0.12)',
                fontSize: compact ? 18 : 22,
                transform: `rotate(${vecDeg}deg)`,
              }}
              aria-hidden
            >
              ↑
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {dir} {windSpeedMs.toFixed(1)} m/s
            </p>
          </div>
          <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--muted)' }}>
            {hint}
          </p>
        </div>
        <div className="min-w-0 rounded-xl p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
            라운드 지수
          </p>
          <p className={`font-black ${compact ? 'text-2xl' : 'text-3xl'}`} style={{ color: GRADE_COLOR[g] }}>
            {score.score}
            <span className="ml-1 text-base font-semibold" style={{ color: 'var(--muted)' }}>/100</span>
          </p>
          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {GRADE_LABEL[g]}
          </p>
          {bestTeeHours.length > 0 && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--humidity)' }}>
              추천 티타임: {bestTeeHours.map((h) => `${h}시`).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

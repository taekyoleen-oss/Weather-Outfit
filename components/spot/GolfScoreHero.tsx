'use client'

import type { GolfScore } from '@/lib/spot/golfScore'

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

interface Props {
  score: GolfScore
  tmnToday: number | null
  tmxToday: number | null
  bestTeeHours: number[]
  compact?: boolean
}

export function GolfScoreHero({ score, tmnToday, tmxToday, bestTeeHours, compact = false }: Props) {
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--muted)' }}>
            골프 라운드 적합도
          </p>
          <p className={`font-black ${compact ? 'text-3xl' : 'text-4xl'} mt-0.5`} style={{ color: GRADE_COLOR[g] }}>
            {score.score}
            <span className={`font-semibold ${compact ? 'text-lg' : 'text-xl'} ml-1`} style={{ color: 'var(--muted)' }}>
              /100
            </span>
          </p>
          <p className="text-sm font-bold mt-1" style={{ color: 'var(--text)' }}>
            {GRADE_LABEL[g]}
          </p>
        </div>
        {(tmnToday != null || tmxToday != null) && (
          <div
            className="text-right text-[11px] flex-shrink-0 px-2 py-1 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p style={{ color: 'var(--muted)' }}>오늘(단기)</p>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>
              {tmnToday != null ? `${tmnToday.toFixed(0)}°` : '--'} /{' '}
              {tmxToday != null ? `${tmxToday.toFixed(0)}°` : '--'}
            </p>
          </div>
        )}
      </div>
      {bestTeeHours.length > 0 && (
        <p className="text-[11px] mt-2 font-medium" style={{ color: 'var(--humidity)' }}>
          추천 티타임: {bestTeeHours.map((h) => `${h}시`).join(', ')}
        </p>
      )}
      {score.reasons.length > 0 && (
        <ul className="mt-2 space-y-1 text-[10px]" style={{ color: 'var(--muted)' }}>
          {score.reasons.slice(0, 4).map((r) => (
            <li key={r.key}>· {r.label}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

'use client'

import { windDirectionLabel } from '@/lib/utils/formatWeather'

interface Props {
  windSpeedMs: number
  vecDeg: number
  compact?: boolean
}

export function FairwayWindCard({ windSpeedMs, vecDeg, compact = false }: Props) {
  const dir = windDirectionLabel(vecDeg)
  let hint = '바람이 잔잔합니다.'
  if (windSpeedMs >= 7) hint = '바람이 강합니다. 클럽 선택·스윙 템포에 여유를 두세요.'
  else if (windSpeedMs >= 5) hint = '바람이 다소 있습니다. 거리 보정을 고려하세요.'

  return (
    <div
      className={`rounded-2xl ${compact ? 'p-3' : 'p-4'}`}
      style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}
    >
      <p className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--primary)' }}>
        페어웨이 바람
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: compact ? 44 : 52,
            height: compact ? 44 : 52,
            background: 'rgba(91,141,238,0.12)',
            fontSize: compact ? 22 : 26,
            transform: `rotate(${vecDeg}deg)`,
          }}
          aria-hidden
        >
          ↑
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {dir} {windSpeedMs.toFixed(1)} m/s
          </p>
          <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--muted)' }}>
            {hint}
          </p>
        </div>
      </div>
    </div>
  )
}

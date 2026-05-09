'use client'

export interface LightningNow {
  level: 'none' | 'watch' | 'warning'
  message: string
  source: string
}

export interface Precip10mItem {
  minuteOffset: number
  timeKst: string
  precipProb: number
  precipMm: number
}

interface Props {
  lightningNow: LightningNow
  precip10m: Precip10mItem[]
}

function ltStyle(level: LightningNow['level']) {
  if (level === 'warning')
    return { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.35)', color: '#b91c1c', icon: '⚡', label: '낙뢰 경계' }
  if (level === 'watch')
    return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)', color: '#b45309', icon: '⚡', label: '낙뢰 주의' }
  return { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)', color: '#15803d', icon: '✓', label: '낙뢰 없음' }
}

export function PrecipRadarCard({ lightningNow, precip10m }: Props) {
  const lt = ltStyle(lightningNow.level)

  return (
    <div className="glass-card p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-base font-semibold" style={{ color: 'var(--muted)' }}>
          초단기 강수 / 낙뢰
        </h3>
        <span className="text-xs font-semibold" style={{ color: lt.color }}>
          {lt.icon} {lt.label}
        </span>
      </div>

      {/* 10-min precip tiles */}
      {precip10m.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scroll-strip pb-1">
          {precip10m.map((p) => (
            <div
              key={p.minuteOffset}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 min-w-[52px] text-center"
              style={{
                background: p.precipMm > 0 ? 'rgba(91,141,238,0.08)' : 'rgba(255,255,255,0.5)',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, lineHeight: 1 }}>
                {p.minuteOffset === 0 ? '지금' : `+${p.minuteOffset}분`}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: p.precipMm > 0 ? 'var(--humidity)' : 'var(--muted)',
                  lineHeight: 1.3,
                }}
              >
                {p.precipMm > 0 ? p.precipMm.toFixed(1) : '없음'}
              </span>
              {p.precipMm > 0 && (
                <span style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1 }}>mm</span>
              )}
              {p.precipProb > 0 && (
                <span style={{ fontSize: 10, color: 'var(--humidity)', lineHeight: 1 }}>
                  {p.precipProb}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

interface AlertRow {
  type: string
  level: string
  message: string
  isLightningRelated: boolean
}

interface Props {
  alerts: AlertRow[]
  compact?: boolean
}

export function GolfRiskAlerts({ alerts, compact = false }: Props) {
  const golfRelevant = alerts.filter(
    (a) =>
      a.isLightningRelated ||
      /강풍|호우|대설|폭염|건조|풍랑|안개|대기/.test(`${a.type} ${a.message}`),
  )
  const show = golfRelevant.length ? golfRelevant.slice(0, 3) : alerts.slice(0, 2)
  if (!show.length) {
    return (
      <div
        className={`rounded-xl ${compact ? 'p-2.5' : 'p-3'} text-[11px]`}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
      >
        현재 발효 중인 기상특보가 없거나, 조회 지역과 직접 매칭되지 않을 수 있습니다. (시·도 단위 근사)
      </div>
    )
  }
  return (
    <div
      className={`rounded-2xl ${compact ? 'p-3' : 'p-4'}`}
      style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}
    >
      <p className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--primary)' }}>
        기상특보 (라운드)
      </p>
      <ul className="mt-2 space-y-2">
        {show.map((a, i) => (
          <li
            key={i}
            className="text-xs rounded-lg p-2.5"
            style={{
              background: a.isLightningRelated ? 'rgba(220,38,38,0.08)' : 'var(--surface)',
              border: `1px solid ${a.isLightningRelated ? 'rgba(220,38,38,0.25)' : 'var(--border)'}`,
              color: 'var(--text)',
            }}
          >
            <span className="font-semibold">{a.type || '특보'} </span>
            <span style={{ color: 'var(--muted)' }}>({a.level})</span>
            {a.message && <p className="mt-1 leading-snug" style={{ color: 'var(--muted)' }}>{a.message}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

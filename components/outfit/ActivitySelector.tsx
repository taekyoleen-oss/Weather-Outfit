'use client'

import type { ActivityType } from '@/types/outfit'

interface Props {
  value: ActivityType
  onChange: (a: ActivityType) => void
}

const ACTIVITIES: { id: ActivityType; label: string; icon: string }[] = [
  { id: 'urban_walk', label: '도심 산책', icon: '🏙️' },
  { id: 'running', label: '달리기', icon: '🏃' },
  { id: 'cycling', label: '자전거', icon: '🚴' },
  { id: 'golf', label: '골프', icon: '⛳' },
  { id: 'hiking', label: '등산', icon: '🏔️' },
  { id: 'picnic', label: '소풍', icon: '🧺' },
  { id: 'river', label: '한강·강변', icon: '🌊' },
  { id: 'beach', label: '해변', icon: '🏖️' },
  { id: 'ski', label: '스키', icon: '⛷️' },
  { id: 'tennis', label: '테니스', icon: '🎾' },
]

export function ActivitySelector({ value, onChange }: Props) {
  return (
    <div>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
        활동 선택
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {ACTIVITIES.map((a) => {
          const selected = value === a.id
          return (
            <button
              key={a.id}
              onClick={() => onChange(a.id)}
              className="flex flex-col items-center gap-1 p-1.5 rounded-xl text-center transition-all"
              style={{
                background: selected ? 'rgba(255,181,71,0.15)' : 'var(--surface)',
                border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
              }}
              aria-pressed={selected}
              aria-label={a.label}
            >
              <span className="text-xl">{a.icon}</span>
              <span
                className="font-medium leading-tight text-center break-keep"
                style={{ color: selected ? 'var(--accent)' : 'var(--muted)', fontSize: '10px' }}
              >
                {a.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

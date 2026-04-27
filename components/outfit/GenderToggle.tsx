'use client'

import type { GenderType } from '@/types/outfit'

interface Props {
  value: GenderType
  onChange: (g: GenderType) => void
}

export function GenderToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        성별
      </p>
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)' }}
        role="group"
        aria-label="성별 선택"
      >
        {([
          { id: 'male' as GenderType, label: '남성', icon: '👨' },
          { id: 'female' as GenderType, label: '여성', icon: '👩' },
        ] as const).map((g) => {
          const selected = value === g.id
          return (
            <button
              key={g.id}
              onClick={() => onChange(g.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: selected ? '#0EA5E9' : 'transparent',
                color: selected ? '#ffffff' : 'var(--muted)',
                boxShadow: selected ? '0 2px 10px rgba(14,165,233,0.35)' : 'none',
                fontWeight: selected ? 700 : 500,
              }}
              aria-pressed={selected}
            >
              <span>{g.icon}</span>
              {g.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

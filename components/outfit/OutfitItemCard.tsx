'use client'

import { useState } from 'react'
import type { OutfitItem } from '@/types/outfit'

interface Props {
  item: OutfitItem
}

export function OutfitItemCard({ item }: Props) {
  const [checked, setChecked] = useState(false)

  return (
    <button
      onClick={() => setChecked(!checked)}
      className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl text-left transition-all w-full"
      style={{
        background: checked ? 'rgba(34,197,94,0.08)' : 'var(--surface)',
        border: `1px solid ${checked ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
        opacity: checked ? 0.7 : 1,
      }}
      aria-pressed={checked}
      aria-label={`${item.name} ${checked ? '챙김' : '미챙김'}`}
    >
      {/* Checkbox */}
      <div
        className="flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: checked ? '#22C55E' : 'var(--border)',
          background: checked ? '#22C55E' : 'transparent',
        }}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </div>

      {/* Icon */}
      <span className="text-lg flex-shrink-0">{item.icon}</span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{
            color: checked ? 'var(--muted)' : 'var(--text)',
            textDecoration: checked ? 'line-through' : 'none',
          }}
        >
          {item.name}
        </p>
        {item.condition && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            {item.condition}
          </p>
        )}
      </div>

      {/* Activity tag */}
      {item.activityTag && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: 'rgba(91,141,238,0.12)', color: 'var(--humidity)', border: '1px solid rgba(91,141,238,0.25)' }}
        >
          {item.activityTag}
        </span>
      )}

      {/* Required badge */}
      <span
        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: item.required ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
          color: item.required ? 'var(--danger)' : 'var(--muted)',
        }}
      >
        {item.required ? '필수' : '선택'}
      </span>
    </button>
  )
}

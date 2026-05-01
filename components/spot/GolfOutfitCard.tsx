'use client'

import { useState } from 'react'

export interface OutfitSummary {
  layerLabel: string
  layerLevel: number
  items: { name: string; icon: string; category: string }[]
  tips: string[]
  dangerLevel: string
  cancelActivity: boolean
  dangerReasons: string[]
}

interface Props {
  outfit: OutfitSummary
  compact?: boolean
}

export function GolfOutfitCard({ outfit, compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const danger = outfit.cancelActivity || outfit.dangerLevel === 'cancel'

  return (
    <>
      <div
        className={`rounded-2xl ${compact ? 'p-3' : 'p-4'}`}
        style={{
          background: 'var(--card, #fff)',
          border: `1px solid ${danger ? 'rgba(220,38,38,0.35)' : 'var(--border)'}`,
        }}
      >
        <p className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--primary)' }}>
          라운드 복장 (4시간 기준)
        </p>
        <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text)' }}>
          {outfit.layerLabel}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {outfit.items.slice(0, 6).map((it, i) => (
            <span
              key={`${it.name}-${i}`}
              className="text-[11px] px-2 py-1 rounded-full"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {it.icon} {it.name}
            </span>
          ))}
        </div>
        {outfit.tips[0] && (
          <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
            {outfit.tips[0]}
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 w-full text-xs font-semibold py-2 rounded-xl"
          style={{ background: 'rgba(91,141,238,0.12)', color: 'var(--humidity)', border: '1px solid var(--border)' }}
        >
          복장·주의사항 자세히
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md max-h-[85dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>골프 복장 상세</p>
              <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-full text-sm" style={{ background: 'var(--surface)', color: 'var(--muted)' }} aria-label="닫기">✕</button>
            </div>
            <div className="p-4 space-y-3 pb-8">
              {outfit.dangerReasons.length > 0 && (
                <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger, #b91c1c)' }}>
                  {outfit.dangerReasons.map((r, i) => (
                    <p key={i} className="mb-1">· {r}</p>
                  ))}
                </div>
              )}
              <ul className="text-xs space-y-1" style={{ color: 'var(--text)' }}>
                {outfit.items.map((it, i) => (
                  <li key={i}>{it.icon} {it.name}</li>
                ))}
              </ul>
              {outfit.tips.map((t, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--muted)' }}>· {t}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

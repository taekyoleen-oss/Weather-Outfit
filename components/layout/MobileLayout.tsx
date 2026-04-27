'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  locationSearch: ReactNode
  gpsLoading: boolean
  gpsError: string | null
  onGps: () => void
  recentChips: ReactNode
  /** 탭과 무관하게 날씨·복장 패널 바로 위에 표시 */
  periodPicker?: ReactNode
  weatherContent: ReactNode
  outfitContent: ReactNode
}

export function MobileLayout({
  locationSearch,
  gpsLoading,
  gpsError,
  onGps,
  recentChips,
  periodPicker,
  weatherContent,
  outfitContent,
}: Props) {
  const [tab, setTab] = useState<'weather' | 'outfit'>('weather')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-40 px-3 pt-3 pb-2"
        style={{
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex gap-2 items-center">
          <div className="flex-1 min-w-0">{locationSearch}</div>
          <button
            onClick={onGps}
            disabled={gpsLoading}
            className="glass-card flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
            style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20,
              color: gpsLoading ? 'var(--muted)' : 'var(--humidity)' }}
            aria-label="내 위치로 설정"
          >
            {gpsLoading ? '⟳' : '📍'}
          </button>
        </div>
        {gpsError && (
          <p className="text-xs mt-1 px-1" style={{ color: 'var(--danger)' }}>{gpsError}</p>
        )}
        <div className="mt-2">{recentChips}</div>
      </div>

      {/* ── Tab selector ── */}
      <div
        className="flex mx-3 mt-3 rounded-2xl p-1 gap-1"
        style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid var(--border)' }}
        role="tablist"
      >
        {(
          [
            { key: 'weather', emoji: '🌤', label: '날씨' },
            { key: 'outfit', emoji: '👔', label: '복장 추천' },
          ] as const
        ).map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all text-sm font-semibold"
              style={{
                background: active ? 'white' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--muted)',
                boxShadow: active ? '0 2px 10px rgba(0,0,0,0.09)' : 'none',
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── 시간대 선택: 탭 공통, 날씨·복장 바로 위 ── */}
      {periodPicker != null && <div className="px-3 pt-3">{periodPicker}</div>}

      {/* ── Tab content ── */}
      <div className="flex-1 px-3 pt-3 pb-10 space-y-3" role="tabpanel">
        {tab === 'weather' ? weatherContent : outfitContent}
      </div>
    </div>
  )
}

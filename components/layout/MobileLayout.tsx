'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

interface TabConfig {
  key: string
  icon: string
  label: string
  header: ReactNode
  content: ReactNode
}

interface Props {
  tabs: readonly TabConfig[]
  defaultTab?: string
}

export function MobileLayout({ tabs, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab ?? tabs[0]?.key ?? '')
  const current = tabs.find(t => t.key === activeTab) ?? tabs[0]

  if (!current) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* ── Sticky per-tab header ── */}
      <div
        className="sticky top-0 z-40"
        style={{
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        {current.header}
      </div>

      {/* ── Tab content ── */}
      <main
        className="flex-1 px-3 pt-3 space-y-3"
        style={{ paddingBottom: 'calc(76px + env(safe-area-inset-bottom))' }}
      >
        {current.content}
      </main>

      {/* ── Bottom Tab Bar (fixed) ── */}
      <nav
        role="tablist"
        aria-label="섹션 전환"
        className="fixed bottom-0 inset-x-0 z-50 flex"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        {tabs.map(t => {
          const active = activeTab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(t.key)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors active:scale-95"
              style={{
                color: active ? 'var(--primary)' : 'var(--muted)',
                fontWeight: active ? 700 : 500,
                background: 'transparent',
                minHeight: 60,
              }}
            >
              <span className="text-lg leading-none" aria-hidden>{t.icon}</span>
              <span className="text-[11px] leading-tight">{t.label}</span>
              <span
                className="block h-0.5 mt-0.5 rounded-full transition-all"
                style={{
                  width: active ? 22 : 0,
                  background: active ? 'var(--primary)' : 'transparent',
                }}
                aria-hidden
              />
            </button>
          )
        })}
      </nav>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
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
  /** 부모에서 탭을 제어할 때(예: 다른 탭으로 프로그램 이동) */
  selectedTab?: string
  onTabChange?: (key: string) => void
}

export function MobileLayout({ tabs, defaultTab, selectedTab, onTabChange }: Props) {
  const [internalTab, setInternalTab] = useState<string>(defaultTab ?? tabs[0]?.key ?? '')
  const isControlled = selectedTab !== undefined && onTabChange !== undefined
  const activeTab = isControlled ? selectedTab! : internalTab
  const setActiveTab = useCallback(
    (key: string) => {
      onTabChange?.(key)
      if (!isControlled) setInternalTab(key)
    },
    [isControlled, onTabChange],
  )

  const current = tabs.find(t => t.key === activeTab) ?? tabs[0]

  if (!current) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--colors-cream-soft)' }}>
      <div className="flex flex-col flex-1 min-h-0">
        {/* 마케팅형 상단 바 — 화이트 캔버스 + 헤어라인 (검정 바 제거) */}
        <div
          className="sticky top-0 z-40"
          style={{
            background: 'var(--colors-canvas)',
            borderBottom: '1px solid var(--colors-hairline-soft)',
            boxShadow: 'rgba(0, 0, 0, 0.03) 0px 1px 2px 0px',
          }}
        >
          {current.header}
        </div>

        <main
          className="flex-1 px-3 pt-4 space-y-6 max-w-[1280px] mx-auto w-full"
          style={{ paddingBottom: 'calc(76px + env(safe-area-inset-bottom))' }}
        >
          {current.content}
        </main>
      </div>

      {/* 하단 탭 — 라이트 서피스 + 오렌지 액센트 */}
      <nav
        role="tablist"
        aria-label="섹션 전환"
        className="fixed bottom-0 inset-x-0 z-50 flex"
        style={{
          background: 'var(--colors-canvas)',
          borderTop: '1px solid var(--colors-hairline-soft)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
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
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors active:opacity-90"
              style={{
                color: active ? 'var(--colors-primary)' : 'var(--colors-slate)',
                fontWeight: active ? 600 : 500,
                background: 'transparent',
                minHeight: 56,
              }}
            >
              <span className="text-lg leading-none" aria-hidden>{t.icon}</span>
              <span className="text-[11px] leading-tight">{t.label}</span>
              <span
                className="block h-0.5 mt-0.5 rounded-full transition-all"
                style={{
                  width: active ? 24 : 0,
                  background: active ? 'var(--colors-primary)' : 'transparent',
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

'use client'

import { useState, useRef, useCallback, type TouchEvent } from 'react'
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

const SWIPE_MIN_PX = 56

export function MobileLayout({ tabs, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab ?? tabs[0]?.key ?? '')
  const current = tabs.find(t => t.key === activeTab) ?? tabs[0]

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const onSwipeZoneTouchStart = useCallback((e: TouchEvent) => {
    const t = e.targetTouches[0]
    if (!t) return
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onSwipeZoneTouchEnd = useCallback(
    (e: TouchEvent) => {
      const start = touchStartRef.current
      touchStartRef.current = null
      if (!start || tabs.length < 2) return
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < SWIPE_MIN_PX) return
      if (Math.abs(dx) < Math.abs(dy) * 1.25) return

      const idx = tabs.findIndex((x) => x.key === activeTab)
      if (idx < 0) return

      // 손가락을 왼쪽으로 밀면(dx < 0) 왼쪽 탭, 오른쪽으로 밀면 오른쪽 탭
      if (dx < 0 && idx > 0) {
        setActiveTab(tabs[idx - 1]!.key)
      } else if (dx > 0 && idx < tabs.length - 1) {
        setActiveTab(tabs[idx + 1]!.key)
      }
    },
    [activeTab, tabs],
  )

  if (!current) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--colors-cream-soft)' }}>
      <div
        className="flex flex-col flex-1 min-h-0"
        onTouchStart={onSwipeZoneTouchStart}
        onTouchEnd={onSwipeZoneTouchEnd}
      >
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

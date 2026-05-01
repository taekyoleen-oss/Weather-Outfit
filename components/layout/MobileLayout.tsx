'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

type TabKey = 'current' | 'detail' | 'outfit' | 'spot'

interface TabMeta {
  key: TabKey
  icon: string
  label: string
  /** screen reader 전용 보충 라벨 */
  srLabel?: string
}

const TABS: readonly TabMeta[] = [
  { key: 'current', icon: '🌤', label: '날씨 / 위치' },
  { key: 'detail',  icon: '📊', label: '세부 날씨' },
  { key: 'outfit',  icon: '👔', label: '외출옷 추천' },
  { key: 'spot',    icon: '⛳', label: '단기 예측' },
] as const

interface Props {
  locationSearch: ReactNode
  gpsLoading: boolean
  gpsError: string | null
  onGps: () => void
  /** 검색·GPS로 확정된 조회 지역 — 모든 탭에서 상단에 한 줄로 표시 */
  locationSummaryLine: string
  recentChips: ReactNode
  /** "현재 날씨" 탭 콘텐츠 (기존 WeatherCard 등) */
  currentContent: ReactNode
  /** "세부 날씨" 탭 콘텐츠 (시간별·하이라이트·주간) */
  weatherContent: ReactNode
  /** "외출 옷" 탭 콘텐츠 (시간대 피커 + OutfitPanel) */
  outfitContent: ReactNode
  /** "시설 초단기" 탭 콘텐츠 (SpotPanel) */
  spotContent: ReactNode
}

export function MobileLayout({
  locationSearch,
  gpsLoading,
  gpsError,
  onGps,
  locationSummaryLine,
  recentChips,
  currentContent,
  weatherContent,
  outfitContent,
  spotContent,
}: Props) {
  const [tab, setTab] = useState<TabKey>('current')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* ── Sticky header (위치 검색 + GPS + 최근/주변 칩) ── */}
      <div
        className="sticky top-0 z-40 px-3 pt-3 pb-2"
        style={{
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        {tab === 'current' && (
          <>
            <div className="flex gap-2 items-end">
              <div className="flex-1 min-w-0">{locationSearch}</div>
              <div className="flex flex-col items-center justify-end gap-1 pb-0.5 flex-shrink-0">
                <button
                  onClick={onGps}
                  disabled={gpsLoading}
                  className="glass-card flex items-center justify-center transition-all active:scale-95"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    fontSize: 20,
                    color: gpsLoading ? 'var(--muted)' : 'var(--humidity)',
                  }}
                  aria-label="내 위치로 설정"
                >
                  {gpsLoading ? '⟳' : '📍'}
                </button>
              </div>
            </div>
            {gpsError && (
              <p className="text-xs mt-1 px-1" style={{ color: 'var(--danger)' }}>{gpsError}</p>
            )}
            <div className="mt-2">{recentChips}</div>
          </>
        )}
        <div
          className="mt-2 px-1 py-1.5 rounded-xl"
          style={{
            background: 'rgba(91,141,238,0.08)',
            border: '1px solid var(--border)',
          }}
        >
          <p
            className="text-xs font-semibold leading-snug truncate"
            style={{ color: 'var(--text)' }}
            title={locationSummaryLine}
          >
            <span aria-hidden>📍 </span>
            <span className="font-medium" style={{ color: 'var(--muted)' }}>조회 지역 </span>
            {locationSummaryLine}
          </p>
        </div>
      </div>

      {/* ── Tab content ── */}
      <main
        id="mobile-tabpanel"
        role="tabpanel"
        aria-labelledby={`mobile-tab-${tab}`}
        className="flex-1 px-3 pt-3 space-y-3"
        // 하단 고정 탭바와 겹치지 않도록 충분한 padding-bottom
        // 64px(탭바) + 12px(여유) + safe-area
        style={{ paddingBottom: 'calc(76px + env(safe-area-inset-bottom))' }}
      >
        {tab === 'current' && currentContent}
        {tab === 'detail'  && weatherContent}
        {tab === 'outfit'  && outfitContent}
        {tab === 'spot'    && spotContent}
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
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              id={`mobile-tab-${t.key}`}
              role="tab"
              aria-selected={active}
              aria-controls="mobile-tabpanel"
              onClick={() => setTab(t.key)}
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

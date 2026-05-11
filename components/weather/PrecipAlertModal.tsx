'use client'

import { useEffect } from 'react'

export interface PrecipGroup {
  label: string
  startHour: number
  endHour: number
}

interface Props {
  groups: PrecipGroup[]
  isAllDay: boolean
  onClose: () => void
}

const TYPE_ICON: Record<string, string> = {
  '비': '🌧',
  '소나기': '⛈',
  '비/눈': '🌨',
  '눈': '❄️',
}

const TYPE_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  '비':    { bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.22)',  text: '#1d4ed8' },
  '소나기': { bg: 'rgba(99,102,241,0.07)',  border: 'rgba(99,102,241,0.22)',  text: '#4338ca' },
  '비/눈':  { bg: 'rgba(14,165,233,0.07)',  border: 'rgba(14,165,233,0.22)',  text: '#0369a1' },
  '눈':    { bg: 'rgba(125,211,252,0.12)', border: 'rgba(14,165,233,0.25)',  text: '#0284c7' },
}

function fmtH(h: number) {
  return String(h).padStart(2, '0')
}

function dominantLabel(groups: PrecipGroup[]): string {
  const priority = ['눈', '비/눈', '소나기', '비']
  for (const p of priority) {
    if (groups.some((g) => g.label === p)) return p
  }
  return groups[0]?.label ?? '비'
}

export function PrecipAlertModal({ groups, isAllDay, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const mainLabel = dominantLabel(groups)
  const mainIcon = TYPE_ICON[mainLabel] ?? '☂️'
  const needsUmbrella = mainLabel === '비' || mainLabel === '소나기' || mainLabel === '비/눈'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="오늘 날씨 알림"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex items-center justify-center rounded-full"
          style={{
            width: 32, height: 32,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            fontSize: 12,
          }}
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 헤더 */}
        <div className="px-5 pt-6 pb-3 text-center">
          <span className="text-5xl leading-none" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>
            {mainIcon}
          </span>
          <p className="text-base font-bold mt-3" style={{ color: 'var(--text)' }}>
            오늘 날씨 알림
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {needsUmbrella ? '우산을 챙기세요 ☂️' : '방한 준비가 필요해요 🧤'}
          </p>
        </div>

        {/* 예보 목록 */}
        <div className="px-4 pb-4 space-y-2">
          {isAllDay ? (
            (() => {
              const c = TYPE_COLOR[mainLabel] ?? TYPE_COLOR['비']!
              return (
                <div
                  className="flex items-center gap-3 px-3 py-3 rounded-xl"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <span className="text-xl flex-shrink-0" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>
                    {TYPE_ICON[mainLabel] ?? '🌧'}
                  </span>
                  <p className="text-sm font-semibold leading-snug" style={{ color: c.text }}>
                    오늘 하루종일 {mainLabel}예보
                  </p>
                </div>
              )
            })()
          ) : (
            groups.map((g, i) => {
              const c = TYPE_COLOR[g.label] ?? TYPE_COLOR['비']!
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <span className="text-xl flex-shrink-0" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>
                    {TYPE_ICON[g.label] ?? '🌧'}
                  </span>
                  <p className="text-sm font-semibold leading-snug" style={{ color: c.text }}>
                    오늘 {fmtH(g.startHour)}시~{fmtH(g.endHour)}시 {g.label}예보
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* 확인 버튼 */}
        <div className="px-4 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors active:opacity-80"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

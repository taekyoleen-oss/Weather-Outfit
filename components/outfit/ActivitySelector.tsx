'use client'

import { useState } from 'react'
import type { ActivityType } from '@/types/outfit'
import { ACTIVITY_GUIDES } from '@/lib/outfit/activityGuides'
import type { ActivityGuideData, RiskGuide } from '@/lib/outfit/activityGuides'

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

const RISK_COLORS: Record<RiskGuide['level'], { bg: string; text: string; border: string; badge: string }> = {
  cancel:  { bg: 'rgba(239,68,68,0.06)',  text: '#B91C1C', border: 'rgba(239,68,68,0.25)',  badge: '#EF4444' },
  warning: { bg: 'rgba(245,158,11,0.06)', text: '#92400E', border: 'rgba(245,158,11,0.25)', badge: '#F59E0B' },
  caution: { bg: 'rgba(14,165,233,0.06)', text: '#0369A1', border: 'rgba(14,165,233,0.25)', badge: '#0EA5E9' },
}

const RISK_LABELS: Record<RiskGuide['level'], string> = {
  cancel:  '⛔ 활동 취소',
  warning: '⚠️ 경고',
  caution: '💡 주의',
}

const SEASON_ICONS: Record<string, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
}

const SEASON_LABELS: Record<string, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
}

function ActivityGuideModal({ guide, onClose }: { guide: ActivityGuideData; onClose: () => void }) {
  const [tab, setTab] = useState<'season' | 'risk' | 'checklist'>('season')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md max-h-[85dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{guide.icon}</span>
              <h3 className="text-base font-bold" style={{ color: 'var(--primary)' }}>{guide.label}</h3>
            </div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
              {guide.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1.5 rounded-full text-lg leading-none flex-shrink-0"
            style={{ color: 'var(--muted)', background: 'var(--surface)' }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2">
          {(['season', 'risk', 'checklist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t ? 'var(--primary)' : 'var(--surface)',
                color: tab === t ? '#fff' : 'var(--muted)',
              }}
            >
              {t === 'season' ? '계절별 복장' : t === 'risk' ? '날씨 위험 기준' : '체크리스트'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {tab === 'season' && (
            <div className="space-y-3 pt-1">
              {(Object.entries(guide.seasons) as [string, typeof guide.seasons.spring][]).map(([season, sg]) => (
                <div
                  key={season}
                  className="rounded-xl p-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                    {SEASON_ICONS[season]} {SEASON_LABELS[season]} — {sg.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sg.items.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(14,165,233,0.10)', color: 'var(--primary)' }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  {sg.note && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                      💡 {sg.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'risk' && (
            <div className="space-y-2.5 pt-1">
              {guide.risks.map((risk, i) => {
                const c = RISK_COLORS[risk.level]
                return (
                  <div
                    key={i}
                    className="rounded-xl p-3"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: c.badge, color: '#fff' }}
                      >
                        {RISK_LABELS[risk.level]}
                      </span>
                      <p className="text-xs font-semibold" style={{ color: c.text }}>
                        {risk.condition}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed mb-1.5" style={{ color: 'var(--text)' }}>
                      {risk.action}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      📋 근거: {risk.source}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'checklist' && (
            <div className="pt-1">
              <div
                className="rounded-xl p-3 space-y-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                  외출 전 확인사항
                </p>
                {guide.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }}>✓</span>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{item}</p>
                  </div>
                ))}
              </div>

              {/* Key risks summary */}
              <div className="mt-3">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>주요 위험 요소</p>
                <div className="flex flex-wrap gap-1.5">
                  {guide.keyRisks.map((r, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#B91C1C', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
                📋 {guide.sourceNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ActivitySelector({ value, onChange }: Props) {
  const [guideActivity, setGuideActivity] = useState<ActivityType | null>(null)
  const guideData = guideActivity ? ACTIVITY_GUIDES[guideActivity] : null

  return (
    <div>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
        활동 선택
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {ACTIVITIES.map((a) => {
          const selected = value === a.id
          return (
            <div key={a.id} className="relative">
              <button
                onClick={() => onChange(a.id)}
                className="w-full flex flex-col items-center gap-1 p-1.5 rounded-xl text-center transition-all"
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
              {/* Info button — 연한 회색 */}
              <button
                onClick={(e) => { e.stopPropagation(); setGuideActivity(a.id) }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold z-10 transition-colors"
                style={{
                  background: 'rgba(148, 163, 184, 0.75)',
                  color: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
                aria-label={`${a.label} 복장 가이드 보기`}
                title={`${a.label} 복장 가이드`}
              >
                ℹ
              </button>
            </div>
          )
        })}
      </div>

      {/* Guide Modal */}
      {guideData && (
        <ActivityGuideModal
          guide={guideData}
          onClose={() => setGuideActivity(null)}
        />
      )}
    </div>
  )
}

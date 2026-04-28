'use client'

import { useState } from 'react'
import type { OutfitResult as OutfitResultType, DangerLevel, GenderType } from '@/types/outfit'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/outfit/categories'
import { OutfitItemCard } from './OutfitItemCard'
import { OutfitIllustPanel } from './OutfitIllustPanel'

interface Props {
  result: OutfitResultType
  gender?: GenderType
  /** KST 달력 월 1–12. 히어로 `fall-layered` 문구용 */
  calendarMonth?: number
}

const LAYER_BAR_COLORS = ['#22C55E', '#FFB547', '#EF4444']

type TabId = 'illust' | 'list'

export function OutfitResult({ result, gender = 'male', calendarMonth }: Props) {
  const [tab, setTab] = useState<TabId>('illust')

  const byCategory = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const items = result.items.filter((i) => i.category === cat)
      if (items.length) acc[cat] = items
      return acc
    },
    {} as Record<string, typeof result.items>
  )

  return (
    <div className="space-y-4">
      {/* Danger Banner */}
      {result.dangerReasons.length > 0 && (
        <DangerBanner
          level={result.dangerLevel}
          reasons={result.dangerReasons}
          cancelActivity={result.cancelActivity}
        />
      )}

      {/* Header: title + layer info (no illustration here) */}
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
          {result.cancelActivity ? '⚠️ 활동 재검토 권고' : '오늘의 복장 추천'}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-sm font-medium px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,181,71,0.15)', color: 'var(--accent)' }}
          >
            {result.layerLabel}
          </span>
          {/* Layer level bar */}
          <div className="flex gap-1">
            {[1, 2, 3].map((l) => (
              <div
                key={l}
                className="w-3 h-3 rounded-full"
                style={{
                  background: l <= result.layerLevel ? LAYER_BAR_COLORS[result.layerLevel - 1] : 'var(--border)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 오존 피크 시간대 경고 */}
      {result.ozoneTimeWarning && (
        <div
          className="flex gap-2.5 rounded-xl p-3"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.30)' }}
        >
          <span className="text-base flex-shrink-0 mt-0.5">⚗️</span>
          <div className="min-w-0">
            {result.ozoneTimeWarning.split('\n').map((line, i) => (
              <p
                key={i}
                className={i === 0 ? 'text-xs font-bold leading-snug' : 'text-xs leading-relaxed mt-1'}
                style={{ color: i === 0 ? '#92400E' : 'var(--text)' }}
              >
                {i === 0 ? line.replace('⚗️ ', '') : line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Microclimate note */}
      {result.microclimateNote && (
        <div
          className="flex gap-2 rounded-xl p-3"
          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: '#0369A1' }}>
            {result.microclimateNote}
          </p>
        </div>
      )}

      {/* Alert badges */}
      {(result.uvAlert || result.dustAlert || result.rainAlert || result.windAlert) && (
        <div className="flex flex-wrap gap-2">
          {result.uvAlert && <AlertBadge icon="☀️" label="자외선 주의" color="#F59E0B" />}
          {result.dustAlert && <AlertBadge icon="😷" label="미세먼지 주의" color="#64748B" />}
          {result.rainAlert && <AlertBadge icon="🌧" label="우천 대비" color="#5B8DEE" />}
          {result.windAlert && <AlertBadge icon="💨" label="강풍 주의" color="#7EC8C8" />}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex rounded-xl overflow-hidden"
        role="tablist"
        style={{ border: '1px solid var(--border)' }}
      >
        {([['illust', '🧍 일러스트'], ['list', '📋 아이템 목록']] as [TabId, string][]).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === id ? 'var(--primary)' : 'var(--surface)',
              color: tab === id ? 'white' : 'var(--muted)',
              borderRight: id === 'illust' ? '1px solid var(--border)' : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panel: 일러스트 */}
      {tab === 'illust' && (
        <div role="tabpanel">
          <OutfitIllustPanel
            result={result}
            gender={gender}
            calendarMonth={calendarMonth}
          />
        </div>
      )}

      {/* Tab panel: 아이템 목록 */}
      {tab === 'list' && (
        <div role="tabpanel" className="space-y-4">
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-4">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat} className="flex items-start gap-2 sm:gap-2.5">
                <p
                  className="text-xs font-semibold uppercase tracking-wide pt-2 w-12 sm:w-14 shrink-0"
                  style={{ color: 'var(--muted)' }}
                >
                  {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}
                </p>
                <div className="grid grid-cols-1 gap-1.5 flex-1 min-w-0">
                  {items.map((item) => (
                    <OutfitItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{ background: 'rgba(91,141,238,0.06)', border: '1px solid rgba(91,141,238,0.15)' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--humidity)' }}>
                착장 팁
              </p>
              {result.tips.map((tip, i) => (
                <p key={i} className="text-sm" style={{ color: 'var(--text)' }}>
                  {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {icon} {label}
    </span>
  )
}

const DANGER_STYLES: Record<DangerLevel, { bg: string; border: string; titleColor: string; title: string }> = {
  none:    { bg: 'transparent', border: 'transparent', titleColor: '', title: '' },
  caution: { bg: 'rgba(14,165,233,0.07)', border: 'rgba(14,165,233,0.3)', titleColor: '#0369A1', title: '💡 주의 사항' },
  warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.35)', titleColor: '#92400E', title: '⚠️ 기상 경고' },
  cancel:  { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.35)', titleColor: '#B91C1C', title: '⛔ 활동 취소 권고' },
}

function DangerBanner({ level, reasons, cancelActivity }: {
  level: DangerLevel
  reasons: string[]
  cancelActivity: boolean
}) {
  if (level === 'none') return null
  const s = DANGER_STYLES[level]
  return (
    <div
      className="rounded-xl p-3 space-y-1.5"
      style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
    >
      <p className="text-sm font-bold" style={{ color: s.titleColor }}>
        {s.title}
      </p>
      {cancelActivity && (
        <p className="text-xs font-semibold" style={{ color: s.titleColor }}>
          현재 기상 조건에서 선택한 활동을 재검토하거나 취소를 권고합니다.
        </p>
      )}
      <div className="space-y-1 mt-1">
        {reasons.map((r, i) => (
          <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
            {r}
          </p>
        ))}
      </div>
    </div>
  )
}

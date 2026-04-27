'use client'

import type { OutfitResult as OutfitResultType } from '@/types/outfit'
import { OutfitItemCard } from './OutfitItemCard'
import { OutfitHeroIllustration } from './OutfitHeroIllustration'

interface Props {
  result: OutfitResultType
}

const CATEGORY_ORDER = ['base', 'top', 'mid', 'outer', 'bottom', 'foot', 'acc', 'rain', 'mask'] as const

const CATEGORY_LABELS: Record<string, string> = {
  base: '이너',
  top: '상의',
  mid: '미들레이어',
  outer: '아우터',
  bottom: '하의',
  foot: '신발',
  acc: '액세서리',
  rain: '우천 준비',
  mask: '마스크',
}

const LAYER_BAR_COLORS = ['#22C55E', '#FFB547', '#EF4444']

export function OutfitResult({ result }: Props) {
  // Group by category
  const byCategory = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const items = result.items.filter((i) => i.category === cat)
      if (items.length) acc[cat] = items
      return acc
    },
    {} as Record<string, typeof result.items>
  )

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
            오늘의 복장 추천
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
        <OutfitHeroIllustration illustKey={result.heroIllust} size={120} />
      </div>

      {/* Alert badges */}
      {(result.uvAlert || result.dustAlert || result.rainAlert || result.windAlert) && (
        <div className="flex flex-wrap gap-2">
          {result.uvAlert && <AlertBadge icon="☀️" label="자외선 주의" color="#F59E0B" />}
          {result.dustAlert && <AlertBadge icon="😷" label="미세먼지 주의" color="#64748B" />}
          {result.rainAlert && <AlertBadge icon="🌧" label="우천 대비" color="#5B8DEE" />}
          {result.windAlert && <AlertBadge icon="💨" label="강풍 주의" color="#7EC8C8" />}
        </div>
      )}

      {/* Items by category */}
      <div className="space-y-4">
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          className="rounded-2xl p-4 space-y-2"
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

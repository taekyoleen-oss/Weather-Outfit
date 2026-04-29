import type { OutfitResult, OutfitWeatherSnapshot, GenderType } from '@/types/outfit'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/outfit/categories'
import { OutfitHeroIllustration } from './OutfitHeroIllustration'

// 왼쪽 항목 표시 순서
// - 액세서리 맨 위 / 마스크 그 다음 / 우천은 하의 위
const LEFT_STACK_ORDER = ['acc', 'mask', 'base', 'top', 'mid', 'outer', 'rain', 'bottom', 'foot'] as const

interface Props {
  result: OutfitResult
  gender: GenderType
  calendarMonth?: number
  showSunshine?: boolean
  weatherSky?: OutfitWeatherSnapshot
}

export function OutfitIllustPanel({ result, gender, calendarMonth, showSunshine, weatherSky }: Props) {
  const byCategory = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const items = result.items.filter((i) => i.category === cat)
      if (items.length) acc[cat] = items
      return acc
    },
    {} as Record<string, typeof result.items>
  )

  const labelRows = LEFT_STACK_ORDER.map((cat) => {
    const items = byCategory[cat] ?? []
    const hasItems = items.length > 0
    const keepBlank = cat === 'rain' || cat === 'acc' || cat === 'mask'
    if (!hasItems && !keepBlank) return null
    return { cat, items, hasItems }
  }).filter(Boolean) as { cat: string; items: typeof result.items; hasItems: boolean }[]

  return (
    <div className="w-full">
      {/* Mobile: illust on top, labels below. sm+: side-by-side grid */}
      <div className="flex flex-col items-center gap-4 sm:grid sm:items-start sm:gap-x-3 sm:gap-y-2"
        style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(190px,230px)' }}
      >
        {/* Illustration — first in DOM for mobile top placement */}
        <div className="sm:col-start-2 sm:row-start-1 sm:self-start sm:flex sm:justify-end sm:pt-5">
          <OutfitHeroIllustration
            illustKey={result.heroIllust}
            items={result.items}
            gender={gender}
            calendarMonth={calendarMonth}
            size={220}
            showSunshine={showSunshine}
            weatherSky={weatherSky}
          />
        </div>

        {/* Labels — below illust on mobile, left column on sm+ */}
        <div className="w-full sm:col-start-1 sm:row-start-1 sm:min-w-0 sm:space-y-2 space-y-2">
          {labelRows.map(({ cat, items, hasItems }) => (
            <div key={cat} className="flex items-start justify-end gap-2">
              <div className="flex flex-wrap gap-1.5 justify-end min-w-0" style={{ minHeight: 22 }}>
                {hasItems
                  ? items.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: item.required ? 'rgba(239,68,68,0.07)' : 'rgba(100,116,139,0.08)',
                          color: item.required ? 'var(--danger)' : 'var(--text)',
                          border: `1px solid ${item.required ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                        }}
                      >
                        <span>{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </span>
                    ))
                  : null}
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-wide shrink-0 pt-0.5"
                style={{ color: hasItems ? 'var(--muted)' : 'transparent' }}
              >
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

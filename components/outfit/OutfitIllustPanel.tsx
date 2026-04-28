import type { OutfitResult, GenderType } from '@/types/outfit'
import { OutfitHeroIllustration } from './OutfitHeroIllustration'

const CATEGORY_ORDER = ['base', 'top', 'mid', 'outer', 'bottom', 'foot', 'acc', 'rain', 'mask'] as const
// 왼쪽 항목 표시 순서 (요청 반영)
// - 액세서리 맨 위
// - 마스크 그 다음
// - 우천은 하의 위 (없어도 공백 유지)
const LEFT_STACK_ORDER = ['acc', 'mask', 'base', 'top', 'mid', 'outer', 'rain', 'bottom', 'foot'] as const

const CATEGORY_LABELS: Record<string, string> = {
  base:  '이너',
  top:   '상의',
  mid:   '미들',
  outer: '아우터',
  bottom:'하의',
  foot:  '신발',
  acc:   '액세서리',
  rain:  '우천',
  mask:  '마스크',
}

interface Props {
  result: OutfitResult
  gender: GenderType
  calendarMonth?: number
}

export function OutfitIllustPanel({ result, gender, calendarMonth }: Props) {
  const byCategory = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const items = result.items.filter((i) => i.category === cat)
      if (items.length) acc[cat] = items
      return acc
    },
    {} as Record<string, typeof result.items>
  )

  return (
    <div className="w-full">
      <div
        className="grid items-start gap-x-3 gap-y-2"
        style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(190px,230px)' }}
      >
        {/* Left: stacked rows (아이템 … 라벨) */}
        <div className="col-start-1 min-w-0 space-y-2">
          {LEFT_STACK_ORDER.map((cat) => {
            const items = byCategory[cat] ?? []
            const hasItems = items.length > 0
            const keepBlank = cat === 'rain' || cat === 'acc' || cat === 'mask'
            if (!hasItems && !keepBlank) return null
            return (
            <div key={cat} className="flex items-start justify-end gap-2">
              <div className="flex flex-wrap gap-1.5 justify-end min-w-0" style={{ minHeight: 22 }}>
                {hasItems ? (
                  items.map((item) => (
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
                ) : null}
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-wide shrink-0 pt-0.5"
                style={{ color: hasItems ? 'var(--muted)' : 'transparent' }}
              >
                {CATEGORY_LABELS[cat]}
              </span>
            </div>
            )
          })}
        </div>

        {/* Right: illustration */}
        <div className="col-start-2 self-start flex justify-end pt-5">
          <OutfitHeroIllustration
            illustKey={result.heroIllust}
            items={result.items}
            gender={gender}
            calendarMonth={calendarMonth}
            size={220}
          />
        </div>
      </div>
    </div>
  )
}

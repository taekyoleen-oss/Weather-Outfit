import type { OutfitResult, GenderType } from '@/types/outfit'
import { OutfitHeroIllustration } from './OutfitHeroIllustration'

const CATEGORY_ORDER = ['base', 'top', 'mid', 'outer', 'bottom', 'foot', 'acc', 'rain', 'mask'] as const

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

const CALLOUT_POS: Record<string, string> = {
  base: 'left-0 top-8',
  top: 'left-0 top-20',
  mid: 'left-0 top-32',
  outer: 'left-0 top-44',
  bottom: 'right-0 top-56',
  foot: 'left-1/2 -translate-x-1/2 bottom-0',
  acc: 'left-1/2 -translate-x-1/2 top-0',
  rain: 'right-0 top-68',
  mask: 'left-0 top-56',
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
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[560px] min-h-[450px]">
        {/* Large dynamic illustration */}
        <div className="flex justify-center">
          <OutfitHeroIllustration
            illustKey={result.heroIllust}
            items={result.items}
            gender={gender}
            calendarMonth={calendarMonth}
            large
          />
        </div>

        {/* Illustration-anchored callouts */}
        {CATEGORY_ORDER.filter((cat) => byCategory[cat]).map((cat) => (
          <div
            key={cat}
            className={`absolute w-[40%] ${CALLOUT_POS[cat] ?? 'left-0 top-0'}`}
          >
            <div
              className={`flex items-start gap-1.5 ${
                cat === 'acc' || cat === 'foot'
                  ? 'justify-center text-center'
                  : cat === 'bottom' || cat === 'rain'
                  ? 'justify-end text-right'
                  : ''
              }`}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-wide shrink-0"
                style={{ color: 'var(--muted)' }}
              >
                {CATEGORY_LABELS[cat]}
              </span>
              <div
                className={`flex flex-wrap gap-1 ${
                  cat === 'acc' || cat === 'foot'
                    ? 'justify-center'
                    : cat === 'bottom' || cat === 'rain'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                {byCategory[cat].map((item) => (
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
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

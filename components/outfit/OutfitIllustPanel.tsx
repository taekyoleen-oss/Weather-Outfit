import type { OutfitItem, OutfitResult, OutfitWeatherSnapshot, GenderType } from '@/types/outfit'
import { CATEGORY_ORDER, CATEGORY_LABELS, type OutfitCategoryKey } from '@/lib/outfit/categories'
import { OutfitHeroIllustration } from './OutfitHeroIllustration'

/** PC·모바일 공통 6단(머리→발): 좌 카테고리 배치 (null = 빈 칸) */
const PC_BAND_LEFT: (OutfitCategoryKey | null)[] = ['acc', 'top', 'mid', 'outer', 'foot', null]
/** 우측 6단 — 하의(bottom)는 4단(좌측 `outer` 아우터와 같은 행) */
const PC_BAND_RIGHT: (OutfitCategoryKey | null)[] = ['rain', 'mask', 'base', 'bottom', null, null]

const BLANK_CATS = new Set(['rain', 'acc', 'mask'])

function itemChips(items: OutfitItem[]) {
  return items.map((item) => (
    <span
      key={item.id}
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full sm:text-[11px]"
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
}

function CategoryBlock({
  cat,
  items,
  align,
  showBlank,
}: {
  cat: OutfitCategoryKey | null
  items: OutfitItem[]
  align: 'left' | 'right'
  showBlank: boolean
}) {
  /** PC에서도 flex-1 줄 수 유지 — `hidden`이면 좌·우 단수가 달라져 하의 등이 어긋남 */
  if (!cat) {
    return <div className="min-h-[20px] flex-1 shrink-0 lg:invisible lg:pointer-events-none" aria-hidden />
  }
  const hasItems = items.length > 0
  const keep = showBlank && BLANK_CATS.has(cat)
  if (!hasItems && !keep) {
    return <div className="min-h-[20px] flex-1 shrink-0 lg:invisible lg:pointer-events-none" aria-hidden />
  }

  const label =
    cat === 'acc' ? (
      <>
        액세서리<span style={{ color: 'var(--muted)' }}> / 기타</span>
      </>
    ) : cat === 'base' ? (
      <>이너·속옷</>
    ) : (
      (CATEGORY_LABELS[cat] ?? cat) as string
    )

  const isRight = align === 'right'
  const rowClass = `flex min-h-0 flex-1 flex-col justify-center gap-1 py-0.5 lg:gap-1 ${isRight ? 'items-start text-left' : 'items-end text-right'}`
  /** PC: 칩 없어도 행 높이 유지(투명) — 좌·우 6단 정렬 */
  const reserveRowOnDesktop = !hasItems

  return (
    <div
      className={`${rowClass}${reserveRowOnDesktop ? ' lg:invisible lg:pointer-events-none' : ''}`}
    >
      {/* 항목명(카테고리): PC(lg+)만 표시 — 모바일·태블릿은 칩만 */}
      <span
        className={`hidden text-xs font-semibold uppercase tracking-wide shrink-0 lg:block ${isRight ? 'text-left' : 'text-right'}`}
        style={{ color: hasItems || keep ? 'var(--muted)' : 'transparent' }}
      >
        {label}
      </span>
      <div
        className={`flex flex-wrap gap-1 min-w-0 sm:gap-1.5 ${isRight ? 'justify-start' : 'justify-end'}`}
        style={{ minHeight: 22 }}
      >
        {hasItems ? itemChips(items) : null}
      </div>
    </div>
  )
}

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

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto flex max-w-full flex-row flex-nowrap items-stretch justify-center gap-2 overflow-x-auto pb-0.5 sm:gap-3 lg:gap-6 lg:max-w-full">
        {/* 좌측 6단 */}
        <div className="order-1 z-auto flex min-h-0 w-[min(112px,28vw)] min-w-0 max-w-[200px] flex-none flex-col max-lg:z-10 max-lg:-mr-[80px] sm:w-[min(130px,26vw)] lg:mr-0 lg:w-[min(260px,28vw)]">
          {PC_BAND_LEFT.map((cat, i) => (
            <CategoryBlock
              key={`L-${i}-${cat ?? 'x'}`}
              cat={cat}
              items={cat ? (byCategory[cat] ?? []) : []}
              align="left"
              showBlank
            />
          ))}
        </div>

        {/* 일러스트 */}
        <div className="order-2 z-auto flex min-w-0 shrink-0 flex-col items-center justify-center self-stretch max-lg:z-0">
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

        {/* 우측 6단 */}
        <div className="order-3 z-auto flex min-h-0 w-[min(112px,28vw)] min-w-0 max-w-[200px] flex-none flex-col max-lg:z-10 max-lg:-ml-[80px] sm:w-[min(130px,26vw)] lg:ml-0 lg:w-[min(260px,28vw)]">
          {PC_BAND_RIGHT.map((cat, i) => (
            <CategoryBlock
              key={`R-${i}-${cat ?? 'x'}`}
              cat={cat}
              items={cat ? (byCategory[cat] ?? []) : []}
              align="right"
              showBlank
            />
          ))}
        </div>
      </div>
    </div>
  )
}

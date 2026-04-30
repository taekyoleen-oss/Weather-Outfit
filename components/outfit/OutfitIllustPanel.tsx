import type { OutfitItem, OutfitResult, OutfitWeatherSnapshot, GenderType } from '@/types/outfit'
import { CATEGORY_ORDER, CATEGORY_LABELS, type OutfitCategoryKey } from '@/lib/outfit/categories'
import { outfitAccessorySrc, type OutfitAccessoryKey } from '@/lib/outfit/accessoryIllust'
import {
  ACCESSORY_ALT,
  accessoriesByOutfitCategory,
  outfitItemToAccessoryKey,
} from '@/lib/outfit/outfitWeatherAccessories'
import { OutfitHeroIllustration } from './OutfitHeroIllustration'

/** PC·모바일 공통 6단(머리→발): 좌 카테고리 배치 (null = 빈 칸) */
const PC_BAND_LEFT: (OutfitCategoryKey | null)[] = ['acc', 'top', 'mid', 'outer', 'foot', null]
/** 우측 6단 — 하의(bottom)는 4단(좌측 `outer` 아우터와 같은 행) */
const PC_BAND_RIGHT: (OutfitCategoryKey | null)[] = ['acc', 'rain', 'base', 'bottom', null, null]

const BLANK_CATS = new Set(['rain', 'acc', 'mask'])

const ILLUST_ACC_IMG_CLASS =
  'h-10 w-10 shrink-0 object-contain sm:h-[2.75rem] sm:w-[2.75rem]'

function itemChipsOrAccessoryImages(items: OutfitItem[], gender: GenderType) {
  return items.map((item, idx) => {
    const accKey = outfitItemToAccessoryKey(item, gender)
    if (accKey) {
      return (
        <img
          key={item.id}
          src={outfitAccessorySrc(accKey)}
          alt={item.name}
          width={44}
          height={44}
          className={ILLUST_ACC_IMG_CLASS}
          style={{ marginLeft: idx === 0 ? 0 : -10 }}
          draggable={false}
          loading="lazy"
        />
      )
    }
    return (
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
    )
  })
}

function CategoryBlock({
  cat,
  items,
  align,
  showBlank,
  accessoryKeys,
  gender,
  variantLabel,
}: {
  cat: OutfitCategoryKey | null
  items: OutfitItem[]
  align: 'left' | 'right'
  showBlank: boolean
  accessoryKeys?: OutfitAccessoryKey[]
  gender: GenderType
  variantLabel?: '필수' | '선택'
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
  const accCount = accessoryKeys?.length ?? 0
  const isVariantAccRow = cat === 'acc' && variantLabel != null
  const hasLargeAccessoryVisual =
    hasItems && items.some((it) => outfitItemToAccessoryKey(it, gender) != null)
  /** PC: 칩 없이 빈 행만 유지할 때만 데스크톱에서 숨김 — 날씨 소품이 있으면 표시 */
  const reserveRowOnDesktop = !hasItems && accCount === 0
  const showVariant = variantLabel != null && (hasItems || accCount > 0)
  const variantBadge = showVariant ? (
    <span
      className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
      style={{
        color: variantLabel === '필수' ? 'var(--danger)' : 'var(--muted)',
        border: `1px solid ${variantLabel === '필수' ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
        background: variantLabel === '필수' ? 'rgba(239,68,68,0.08)' : 'rgba(100,116,139,0.08)',
      }}
    >
      {variantLabel}
    </span>
  ) : null

  return (
    <div
      className={`${rowClass}${reserveRowOnDesktop ? ' lg:invisible lg:pointer-events-none' : ''}`}
    >
      {/* 항목명(카테고리): PC(lg+)만 표시 — 모바일·태블릿은 칩만 */}
      <span
        className={`hidden text-xs font-semibold uppercase tracking-wide shrink-0 lg:block ${isRight ? 'text-left' : 'text-right'}`}
        style={{ color: hasItems || keep || accCount > 0 ? 'var(--muted)' : 'transparent' }}
      >
        {label}
        <span className="ml-1.5">{variantBadge}</span>
      </span>
      <div
        className={`flex min-w-0 items-center ${
          isVariantAccRow
            ? `w-full flex-nowrap gap-1 px-2 sm:px-3 ${isRight ? 'justify-start' : 'justify-end'}`
            : `flex-wrap gap-1.5 sm:gap-2 ${isRight ? 'justify-start' : 'justify-end'}`
        }`}
        style={{
          minHeight: Math.max(22, accCount > 0 || hasLargeAccessoryVisual ? (hasLargeAccessoryVisual ? 88 : 40) : 22),
          width: isVariantAccRow ? '150%' : undefined,
          transform: isVariantAccRow ? `translateX(${isRight ? '-40px' : '40px'})` : undefined,
        }}
      >
        {/* 모바일/태블릿에서는 카테고리 라벨이 숨겨져 필수/선택 배지를 행 안에 노출 */}
        {showVariant ? (
          <span className="lg:hidden inline-flex shrink-0">{variantBadge}</span>
        ) : null}
        {hasItems ? itemChipsOrAccessoryImages(items, gender) : null}
        {accessoryKeys?.map((key, idx) => (
          <img
            key={key}
            src={outfitAccessorySrc(key)}
            alt={ACCESSORY_ALT[key]}
            width={44}
            height={44}
            className={ILLUST_ACC_IMG_CLASS}
            style={{ marginLeft: idx === 0 ? 0 : -10 }}
            draggable={false}
            loading="lazy"
          />
        ))}
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

  const weatherAccessories = accessoriesByOutfitCategory(result, gender, weatherSky, showSunshine)
  const allAccItems = ((byCategory.acc ?? []) as OutfitItem[]).filter(
    (it) => !it.name.includes('넥워머'),
  )
  const requiredAccItems = allAccItems.filter((it) => it.required)
  const optionalAccItems = allAccItems.filter((it) => !it.required)

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto flex max-w-full flex-row flex-nowrap items-stretch justify-center gap-1 overflow-x-auto pb-0.5 sm:gap-2 lg:gap-3 lg:max-w-full">
        {/* 좌측 6단 */}
        <div className="order-1 z-auto flex min-h-0 w-[min(108px,27vw)] min-w-0 max-w-[180px] flex-none flex-col max-lg:z-10 max-lg:-mr-[84px] sm:w-[min(124px,25vw)] lg:mr-0 lg:w-[min(220px,24vw)]">
          {PC_BAND_LEFT.map((cat, i) => (
            <CategoryBlock
              key={`L-${i}-${cat ?? 'x'}`}
              cat={cat}
              items={cat === 'acc' ? requiredAccItems : cat ? (byCategory[cat] ?? []) : []}
              align="left"
              showBlank
              accessoryKeys={cat === 'acc' ? undefined : cat ? weatherAccessories[cat] : undefined}
              gender={gender}
              variantLabel={cat === 'acc' ? '필수' : undefined}
            />
          ))}
        </div>

        {/* 일러스트 */}
        <div className="order-2 z-auto flex min-w-0 shrink-0 flex-col items-center justify-center self-stretch max-lg:z-0">
          <OutfitHeroIllustration
            illustKey={result.heroIllust}
            items={result.items}
            gender={gender}
            tempZone={result.tempZone}
            calendarMonth={calendarMonth}
            size={220}
            showSunshine={showSunshine}
            weatherSky={weatherSky}
          />
        </div>

        {/* 우측 6단 */}
        <div className="order-3 z-auto flex min-h-0 w-[min(108px,27vw)] min-w-0 max-w-[180px] flex-none flex-col max-lg:z-10 max-lg:-ml-[84px] sm:w-[min(124px,25vw)] lg:ml-0 lg:w-[min(220px,24vw)]">
          {PC_BAND_RIGHT.map((cat, i) => (
            <CategoryBlock
              key={`R-${i}-${cat ?? 'x'}`}
              cat={cat}
              items={cat === 'acc' ? optionalAccItems : cat ? (byCategory[cat] ?? []) : []}
              align="right"
              showBlank
              accessoryKeys={cat === 'acc' ? undefined : cat ? weatherAccessories[cat] : undefined}
              gender={gender}
              variantLabel={cat === 'acc' ? '선택' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

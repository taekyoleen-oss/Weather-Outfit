import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { OutfitItem, OutfitResult, OutfitWeatherSnapshot, GenderType } from '@/types/outfit'
import { CATEGORY_ORDER, CATEGORY_LABELS, type OutfitCategoryKey } from '@/lib/outfit/categories'
import { outfitAccessorySrc, type OutfitAccessoryKey } from '@/lib/outfit/accessoryIllust'
import {
  ACCESSORY_ALT,
  accessoriesByOutfitCategory,
  outfitItemToAccessoryKey,
} from '@/lib/outfit/outfitWeatherAccessories'
import { OutfitHeroIllustration } from './OutfitHeroIllustration'
import { AutoShrinkText } from './AutoShrinkText'

/** PC·모바일 공통 6단(머리→발): 좌 카테고리 배치 (null = 빈 칸) */
const PC_BAND_LEFT: (OutfitCategoryKey | null)[] = ['acc', 'top', 'mid', 'outer', 'foot', null]
/** 우측 6단 — 하의(bottom)는 4단(좌측 `outer` 아우터와 같은 행) */
const PC_BAND_RIGHT: (OutfitCategoryKey | null)[] = ['acc', 'rain', 'base', 'bottom', null, null]

const BLANK_CATS = new Set(['rain', 'acc', 'mask'])

/** 일반 행: 텍스트 칩 옆 소형 PNG */
const ILLUST_ACC_IN_CHIP_CLASS = 'h-5 w-5 shrink-0 object-contain sm:h-5 sm:w-5'
/** 필수/선택 액세서리 행: 글자 없이 그림만(1.5×) */
const ILLUST_ACC_VARIANT_ROW_CLASS = 'h-[30px] w-[30px] shrink-0 object-contain sm:h-[30px] sm:w-[30px]'
const ACC_VARIANT_IMG_PX = 30

const ITEM_CHIP_CLASS =
  'inline-flex max-w-full min-w-0 items-start gap-0.5 text-[14px] px-0.5 py-0.5 rounded-full sm:text-[16px]'

function itemChipShellStyle(required: boolean): CSSProperties {
  return {
    background: required ? 'rgba(239,68,68,0.07)' : 'rgba(100,116,139,0.08)',
    color: required ? 'var(--danger)' : 'var(--text)',
    border: `1px solid ${required ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
  }
}

/** 그림만 있을 때 호버·접근성용 설명 (브라우저 기본 툴팁) */
function itemIllustTooltip(item: OutfitItem): string {
  const parts = [item.name, item.condition, item.activityTag].filter(Boolean) as string[]
  return parts.join(' — ')
}

const WEATHER_ACCESSORY_TOOLTIP: Partial<Record<OutfitAccessoryKey, string>> = {
  umbrellaOpen: '날씨 조건에 따른 우산·우천 대비',
  hatMale: '날씨·자외선 조건에 따른 모자',
  hatFemaleWide: '날씨·자외선 조건에 따른 모자',
  sunglasses: '날씨·자외선 조건에 따른 선글라스',
  gloves: '기온·체감 조건에 따른 장갑',
  scarf: '한랭·바람 조건에 따른 목도리',
  windbreaker: '강풍 등 날씨 조건에 따른 바람막이',
  trekkingPole: '등산·트레킹 시 무릎 보호용 스틱',
}

/** 조건에서 시간대 레이블 추출 — "19~21시 기준 추가" → "19~21시", 일반 조건은 null */
function coldPeriodTimeLabel(condition?: string): string | null {
  if (!condition?.includes('기준 추가')) return null
  return condition.split(' 기준')[0] ?? null
}

function itemChip(item: OutfitItem, idx: number, iconOnly?: boolean) {
  const tooltip = itemIllustTooltip(item)
  const timeLabel = coldPeriodTimeLabel(item.condition)
  if (iconOnly) {
    return (
      <span
        key={item.id}
        className={ITEM_CHIP_CLASS}
        style={{
          ...itemChipShellStyle(item.required),
          marginLeft: idx === 0 ? 0 : 4,
        }}
        title={tooltip}
        aria-label={tooltip}
      >
        <span className="flex-shrink-0 text-[15px] sm:text-base leading-none" aria-hidden>
          {item.icon}
        </span>
      </span>
    )
  }
  return (
    <span
      key={item.id}
      className={ITEM_CHIP_CLASS}
      style={{
        ...itemChipShellStyle(item.required),
        marginLeft: idx === 0 ? 0 : 4,
      }}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <AutoShrinkText text={item.name} className="font-medium" />
      {timeLabel && (
        <span className="shrink-0 ml-auto pl-1 text-[8px] leading-none opacity-55 self-end">{timeLabel}</span>
      )}
    </span>
  )
}

/** 액세서리 PNG: `acc` 이거나, 바람막이·윈드쉘 계열(`windbreaker` 키)은 아우터/미들에서도 동일 에셋 표시 */
function itemChipsOrAccessoryImages(items: OutfitItem[], gender: GenderType, accVariantRow: boolean) {
  return items.map((item, idx) => {
    const accKey = outfitItemToAccessoryKey(item, gender)
    const useAccessoryImage =
      accKey && (item.category === 'acc' || accKey === 'windbreaker')
    if (useAccessoryImage) {
      const tip = itemIllustTooltip(item)
      const imgPx = accVariantRow ? ACC_VARIANT_IMG_PX : 20
      const imgClass = accVariantRow ? ILLUST_ACC_VARIANT_ROW_CLASS : ILLUST_ACC_IN_CHIP_CLASS
      return (
        <span
          key={item.id}
          className={ITEM_CHIP_CLASS}
          style={{
            ...itemChipShellStyle(item.required),
            marginLeft: idx === 0 ? 0 : 4,
          }}
        >
          <span className="flex-shrink-0 inline-flex">
            <Image
              src={outfitAccessorySrc(accKey)}
              alt={tip}
              title={tip}
              aria-label={tip}
              width={imgPx}
              height={imgPx}
              className={imgClass}
              sizes={`${imgPx}px`}
              loading="lazy"
            />
          </span>
          {!accVariantRow ? (
            <AutoShrinkText text={item.name} className="font-medium min-w-0" />
          ) : null}
        </span>
      )
    }
    return itemChip(item, idx, accVariantRow)
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
  /** 예전 큰 PNG 행 높이용 — 칩 스타일로 바뀌어 일반 칩 행과 동일 높이면 충분 */
  const hasAccessoryVisual = hasItems && items.some((it) => outfitItemToAccessoryKey(it, gender) != null)
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
          minHeight: Math.max(22, isVariantAccRow ? 48 : accCount > 0 || hasAccessoryVisual ? 40 : 22),
          width: isVariantAccRow ? '150%' : undefined,
          transform: isVariantAccRow ? `translateX(${isRight ? '-30px' : '30px'})` : undefined,
        }}
      >
        {/* 모바일/태블릿에서는 카테고리 라벨이 숨겨져 필수/선택 배지를 행 안에 노출 */}
        {showVariant ? (
          <span className="lg:hidden inline-flex shrink-0">{variantBadge}</span>
        ) : null}
        {hasItems ? itemChipsOrAccessoryImages(items, gender, isVariantAccRow) : null}
        {accessoryKeys?.map((key, idx) => {
          const tip = WEATHER_ACCESSORY_TOOLTIP[key] ?? ACCESSORY_ALT[key]
          const imgPx = isVariantAccRow ? ACC_VARIANT_IMG_PX : 20
          const imgClass = isVariantAccRow ? ILLUST_ACC_VARIANT_ROW_CLASS : ILLUST_ACC_IN_CHIP_CLASS
          return (
            <span
              key={key}
              className={ITEM_CHIP_CLASS}
              style={{
                ...itemChipShellStyle(false),
                marginLeft: idx === 0 ? 0 : 4,
              }}
            >
              <span className="flex-shrink-0 inline-flex">
                <Image
                  src={outfitAccessorySrc(key)}
                  alt={tip}
                  title={tip}
                  aria-label={tip}
                  width={imgPx}
                  height={imgPx}
                  className={imgClass}
                  sizes={`${imgPx}px`}
                  loading="lazy"
                />
              </span>
              {!isVariantAccRow ? (
                <AutoShrinkText text={ACCESSORY_ALT[key]} className="font-medium min-w-0" />
              ) : null}
            </span>
          )
        })}
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
      const items = result.items.filter((i) => i.category === cat && !i.activityTag)
      if (items.length) acc[cat] = items
      return acc
    },
    {} as Record<string, typeof result.items>
  )

  const weatherAccessories = accessoriesByOutfitCategory(result, gender, weatherSky, showSunshine)
  const accOrActivity = (it: OutfitItem) =>
    it.category === 'acc' || !!it.activityTag
  const allAccItems = (result.items as OutfitItem[]).filter(
    (it) => accOrActivity(it) && !it.name.includes('넥워머'),
  )
  const requiredAccItems = allAccItems.filter((it) => it.required)
  const optionalAccItems = allAccItems.filter((it) => !it.required)

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto flex max-w-full flex-row flex-nowrap items-stretch justify-center gap-1 overflow-x-auto pb-0.5 sm:gap-2 lg:gap-3 lg:max-w-full">
        {/* 좌측 6단 */}
        <div className="order-1 z-auto flex min-h-0 w-[min(108px,33vw)] min-w-0 flex-none flex-col max-lg:z-10 max-lg:-mr-[84px] sm:w-[min(124px,25vw)] lg:mr-0 lg:w-[min(220px,24vw)]">
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
        <div className="order-3 z-auto flex min-h-0 w-[min(108px,33vw)] min-w-0 flex-none flex-col max-lg:z-10 max-lg:-ml-[84px] sm:w-[min(124px,25vw)] lg:ml-0 lg:w-[min(220px,24vw)]">
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

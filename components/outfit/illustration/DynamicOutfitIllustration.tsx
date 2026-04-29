'use client'

import { useId } from 'react'
import type { OutfitItem, HeroIllustKey, GenderType, OutfitWeatherSnapshot } from '@/types/outfit'
import { Scene } from './layers/Scene'
import { Body } from './layers/Body'
import { Top } from './layers/Top'
import { Mid } from './layers/Mid'
import { Outer } from './layers/Outer'
import { Bottom } from './layers/Bottom'
import { Foot } from './layers/Foot'
import { AccHat, AccFace } from './layers/Acc'
import { RainMask } from './layers/RainMask'
import {
  getTopVariant,
  getMidVariant,
  getOuterVariant,
  getBottomVariant,
  getFootVariant,
  getAccSet,
  hasUmbrella,
  hasMask,
} from './itemLayerMap'
import {
  ILLUST_SKY_TOP,
  ILLUST_VB_W,
  ILLUST_VIEWBOX_HEIGHT,
  illustDisplayHeightOverWidth,
  illustViewBoxString,
} from './illustViewBox'
import { WeatherSkyDecor } from './WeatherSkyDecor'

interface Props {
  items: OutfitItem[]
  illustKey: HeroIllustKey
  gender: GenderType
  size?: number
  /** `fluid`: 부모 너비에 맞춤(모바일 등에서 좌우 패딩 최소화 시 사용) */
  layout?: 'fixed' | 'fluid'
  /** 1–12, KST 달력. SVG 계절 팔레트·상의 소매 톤에 사용 */
  calendarMonth?: number
  /** 맑음일 때 Scene에 햇빛·광선 표시 */
  showSunshine?: boolean
  /** 상단 첨부 스타일 라인 날씨 아이콘 */
  weatherSky?: OutfitWeatherSnapshot
}

export function DynamicOutfitIllustration({
  items,
  illustKey,
  gender,
  size = 300,
  layout = 'fixed',
  calendarMonth,
  showSunshine,
  weatherSky,
}: Props) {
  const sunGradPrefix = useId().replace(/:/g, '')
  const topVariant    = getTopVariant(items)
  const midVariant    = getMidVariant(items)
  const outerVariant  = getOuterVariant(items)
  const bottomVariant = getBottomVariant(items)
  const footVariant   = getFootVariant(items)
  const accSet        = getAccSet(items)
  const umbrella      = hasUmbrella(items)
  const mask          = hasMask(items)
  const effectiveHat  = accSet.hat ?? (outerVariant === 'raincoat' ? 'hood' : null)
  const hasHelmet     = effectiveHat === 'helmet'
  const longSleeve =
    topVariant === 'longsleeve' ||
    topVariant === 'knit' ||
    topVariant === 'rashguard'
  /** 후드·스웨터·가디건은 실제로 긴팔이므로 상의가 반팔이어도 미드는 긴팔 실루엣 */
  const midSleeveLength: 'long' | 'short' =
    midVariant != null && midVariant !== 'vest' ? 'long' : 'short'

  const vb = illustViewBoxString()
  const pxH = size * illustDisplayHeightOverWidth()
  const fluid = layout === 'fluid'

  return (
    <svg
      viewBox={vb}
      width={fluid ? '100%' : size}
      height={fluid ? undefined : pxH}
      style={
        fluid
          ? { display: 'block', aspectRatio: `${ILLUST_VB_W} / ${ILLUST_VIEWBOX_HEIGHT}` }
          : { display: 'block' }
      }
      preserveAspectRatio={fluid ? 'xMidYMid meet' : undefined}
      aria-hidden="true"
    >
      {/* 상단 하늘 여백(태양·날씨 데코용) — 아주 옅은 그라데이션만 */}
      <defs>
        <linearGradient
          id={`${sunGradPrefix}-skyTop`}
          x1="0"
          y1={-ILLUST_SKY_TOP}
          x2="0"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#FEF9C3" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        x="0"
        y={-ILLUST_SKY_TOP}
        width={ILLUST_VB_W}
        height={ILLUST_SKY_TOP}
        fill={`url(#${sunGradPrefix}-skyTop)`}
      />

      {/* 1. Background scene */}
      <Scene illustKey={illustKey} showSunshine={showSunshine} sunGradPrefix={sunGradPrefix} />

      {/* 1b. 첨부 스타일 라인 날씨 (하늘·비·눈·소나기 등) */}
      {weatherSky ? <WeatherSkyDecor skyCode={weatherSky.skyCode} ptyCode={weatherSky.ptyCode} /> : null}

      {/* 2. Bottom clothes (pants/skirt + bare legs) */}
      <Bottom variant={bottomVariant} calendarMonth={calendarMonth} />

      {/* 3. Top shirt */}
      <Top variant={topVariant} calendarMonth={calendarMonth} />

      {/* 4. Mid layer (cardigan/hoodie/sweater) */}
      <Mid variant={midVariant} calendarMonth={calendarMonth} sleeveLength={midSleeveLength} />

      {/* 5. Outer layer (jacket/coat/padding) */}
      <Outer variant={outerVariant} sleeveLength={longSleeve ? 'long' : 'short'} calendarMonth={calendarMonth} />

      {/* 6. Shoes */}
      <Foot variant={footVariant} calendarMonth={calendarMonth} />

      {/* 7. Hat/helmet — drawn BEFORE head so head circle overlaps lower edge */}
      <AccHat hat={effectiveHat} />

      {/* 8. Body: neck + hair + head + face */}
      <Body gender={gender} hasHelmet={hasHelmet} />

      {/* 9. Face accessories (scarf, sunglasses, goggles, gloves) — drawn after head */}
      <AccFace
        scarf={accSet.scarf}
        sunglasses={accSet.sunglasses}
        goggles={accSet.goggles}
        gloves={accSet.gloves}
        armsleeve={accSet.armsleeve}
      />

      {/* 10. Rain accessories (umbrella) + mask over face */}
      <RainMask hasUmbrella={umbrella} hasMask={mask} />
    </svg>
  )
}

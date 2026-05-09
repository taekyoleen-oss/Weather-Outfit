'use client'

import type { OutfitItem, HeroIllustKey, GenderType, OutfitWeatherSnapshot, TempZone } from '@/types/outfit'
import { ILLUST_VB_W, ILLUST_VIEWBOX_HEIGHT, illustViewBoxString, illustDisplayHeightOverWidth } from './illustViewBox'
import { Body } from './layers/Body'
import { Top } from './layers/Top'
import { Mid } from './layers/Mid'
import { Outer } from './layers/Outer'
import { Bottom } from './layers/Bottom'
import { Foot } from './layers/Foot'
import { AccHat, AccFace } from './layers/Acc'
import { Scene } from './layers/Scene'
import {
  getTopVariant,
  getMidVariant,
  getOuterVariant,
  getBottomVariant,
  getFootVariant,
  getAccSet,
} from './itemLayerMap'

interface Props {
  items: OutfitItem[]
  illustKey: HeroIllustKey
  gender: GenderType
  tempZone: TempZone
  size?: number
  layout?: 'fixed' | 'fluid'
  calendarMonth?: number
  showSunshine?: boolean
  weatherSky?: OutfitWeatherSnapshot
}

export function DynamicOutfitIllustration({
  items,
  illustKey,
  gender,
  tempZone,
  size = 300,
  layout = 'fixed',
  calendarMonth,
  showSunshine,
  weatherSky,
}: Props) {
  void tempZone
  void showSunshine
  void weatherSky

  const topVariant    = getTopVariant(items)
  const midVariant    = getMidVariant(items)
  const outerVariant  = getOuterVariant(items)
  const bottomVariant = getBottomVariant(items)
  const footVariant   = getFootVariant(items)
  const accSet        = getAccSet(items)
  const hasHelmet     = accSet.hat === 'helmet'

  const viewBox = illustViewBoxString()
  const pxH     = Math.round(size * illustDisplayHeightOverWidth())
  const fluid   = layout === 'fluid'
  const alt     = gender === 'female' ? '여성 복장 일러스트' : '남성 복장 일러스트'

  const svgEl = (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={alt}
      role="img"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      {/* 배경 장식 */}
      <Scene illustKey={illustKey} />

      {/* 신체 뒤 레이어: 하의 → 상의 → 미드 → 아우터 */}
      <Bottom   variant={bottomVariant} calendarMonth={calendarMonth} />
      <Top      variant={topVariant}    calendarMonth={calendarMonth} />
      {midVariant   && <Mid   variant={midVariant}   calendarMonth={calendarMonth} sleeveLength="long" />}
      {outerVariant && <Outer variant={outerVariant} calendarMonth={calendarMonth} />}

      {/* 모자: Body보다 먼저 그려야 머리 타원이 모자 하단을 덮음 */}
      <AccHat hat={accSet.hat} />

      {/* 얼굴·머리 */}
      <Body gender={gender} hasHelmet={hasHelmet} />

      {/* 얼굴 위 액세서리(선글라스·고글·목도리·장갑) — ski-jacket에 장갑이 내장되어 있으므로 중복 방지 */}
      <AccFace
        scarf={accSet.scarf}
        sunglasses={accSet.sunglasses}
        goggles={accSet.goggles}
        gloves={accSet.gloves && outerVariant !== 'ski-jacket'}
        armsleeve={accSet.armsleeve}
      />

      {/* 신발 */}
      <Foot variant={footVariant} calendarMonth={calendarMonth} />
    </svg>
  )

  if (fluid) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${ILLUST_VB_W} / ${ILLUST_VIEWBOX_HEIGHT}`,
        }}
      >
        {svgEl}
      </div>
    )
  }

  return (
    <div style={{ width: size, height: pxH, flexShrink: 0 }}>
      {svgEl}
    </div>
  )
}

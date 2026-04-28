import type { OutfitItem, HeroIllustKey, GenderType } from '@/types/outfit'
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

interface Props {
  items: OutfitItem[]
  illustKey: HeroIllustKey
  gender: GenderType
  size?: number
}

export function DynamicOutfitIllustration({ items, illustKey, gender, size = 300 }: Props) {
  const topVariant    = getTopVariant(items)
  const midVariant    = getMidVariant(items)
  const outerVariant  = getOuterVariant(items)
  const bottomVariant = getBottomVariant(items)
  const footVariant   = getFootVariant(items)
  const accSet        = getAccSet(items)
  const umbrella      = hasUmbrella(items)
  const mask          = hasMask(items)
  const hasHelmet     = accSet.hat === 'helmet'
  const longSleeve =
    topVariant === 'longsleeve' ||
    topVariant === 'knit' ||
    topVariant === 'rashguard'

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * 1.2}
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {/* 1. Background scene */}
      <Scene illustKey={illustKey} />

      {/* 2. Bottom clothes (pants/skirt + bare legs) */}
      <Bottom variant={bottomVariant} />

      {/* 3. Top shirt */}
      <Top variant={topVariant} />

      {/* 4. Mid layer (cardigan/hoodie/sweater) */}
      <Mid variant={midVariant} />

      {/* 5. Outer layer (jacket/coat/padding) */}
      <Outer variant={outerVariant} sleeveLength={longSleeve ? 'long' : 'short'} />

      {/* 6. Shoes */}
      <Foot variant={footVariant} />

      {/* 7. Hat/helmet — drawn BEFORE head so head circle overlaps lower edge */}
      <AccHat hat={accSet.hat} />

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

'use client'

import Image from 'next/image'
import type { OutfitItem, HeroIllustKey, GenderType, OutfitWeatherSnapshot, TempZone } from '@/types/outfit'
import { outfitCharacterImageSrc } from '@/lib/outfit/characterIllust'
import { ILLUST_VB_W, ILLUST_VIEWBOX_HEIGHT, illustDisplayHeightOverWidth } from './illustViewBox'

interface Props {
  items: OutfitItem[]
  illustKey: HeroIllustKey
  gender: GenderType
  tempZone: TempZone
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
  tempZone,
  size = 300,
  layout = 'fixed',
  calendarMonth,
  showSunshine,
  weatherSky,
}: Props) {
  void items
  void illustKey
  void calendarMonth
  void showSunshine
  void weatherSky
  const pxH = Math.round(size * illustDisplayHeightOverWidth())
  const fluid = layout === 'fluid'
  const alt = gender === 'female' ? '여성 복장 일러스트' : '남성 복장 일러스트'

  const src = outfitCharacterImageSrc(gender, tempZone)

  const imgStyle = {
    filter: 'saturate(1.08) contrast(1.04)',
    transform: fluid ? 'scale(1.14)' : 'scale(1.08)',
    transformOrigin: 'center 56%',
  }

  if (fluid) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${ILLUST_VB_W} / ${ILLUST_VIEWBOX_HEIGHT}`,
        }}
      >
        <Image
          fill
          src={src}
          alt={alt}
          style={{ objectFit: 'contain', ...imgStyle }}
          sizes={`(max-width: 640px) 100vw, ${size}px`}
        />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={pxH}
      style={{ display: 'block', ...imgStyle }}
      sizes={`${size}px`}
      priority
    />
  )
}

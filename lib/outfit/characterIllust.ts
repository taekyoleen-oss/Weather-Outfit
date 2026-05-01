import type { GenderType, TempZone } from '@/types/outfit'

const CHAR_BASE = '/outfit/characters'

/**
 * 체감 구간 → 에셋 슬롯.
 * `public/outfit/characters/{female|male}-{slot}-v1.png` — 슬롯을 합치려면 여기서 동일 문자열로 매핑.
 */
const SLOT_BY_ZONE: Record<TempZone, string> = {
  hot: 'hot',
  warm: 'warm',
  mild: 'mild',
  cool: 'cool',
  cold: 'cold',
  freezing: 'freezing',
}

export function outfitCharacterImageSrc(gender: GenderType, tempZone: TempZone): string {
  const slot = SLOT_BY_ZONE[tempZone]
  const file = gender === 'female' ? `female-${slot}-v1.webp` : `male-${slot}-v1.webp`
  return `${CHAR_BASE}/${file}`
}

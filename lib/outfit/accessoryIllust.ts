/**
 * 복장 UI 보조(우산·모자 등)용 소형 일러스트 경로.
 * 스펙·추가 절차는 `docs/outfit-character-assets.md` 를 단일 소스로 유지합니다.
 */
/** 모자: UI 표기는 공통 "모자" — 일러만 성별(`acc-hat-*`) 구분 */
export const OUTFIT_ACCESSORY_ASSETS = {
  umbrellaOpen: '/outfit/accessories/acc-umbrella-open-v1.webp',
  hatMale: '/outfit/accessories/acc-hat-male-v1.webp',
  /** 여성 전용 와이드 챙 일러 (남성은 `hatMale`) */
  hatFemaleWide: '/outfit/accessories/acc-hat-female-wide-v1.webp',
  sunglasses: '/outfit/accessories/acc-sunglasses-v1.webp',
  gloves: '/outfit/accessories/acc-gloves-v1.webp',
  scarf: '/outfit/accessories/acc-scarf-v1.webp',
  windbreaker: '/outfit/accessories/acc-windbreaker-v1.webp',
} as const

export type OutfitAccessoryKey = keyof typeof OUTFIT_ACCESSORY_ASSETS

export function outfitAccessorySrc(key: OutfitAccessoryKey): string {
  return OUTFIT_ACCESSORY_ASSETS[key]
}

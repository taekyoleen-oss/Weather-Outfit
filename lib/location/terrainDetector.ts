import type { TerrainType } from '@/types/location'

const MOUNTAIN_KEYWORDS = ['산', '봉', '령', '고개', '계곡', '등산', '트레킹']
const COASTAL_KEYWORDS = ['해수욕장', '해변', '바다', '항구', '포구', '선착장', '갯벌']
const RIVER_KEYWORDS = ['한강', '강변', '수변', '호수', '저수지', '천']
const GOLF_KEYWORDS = ['골프', 'golf', 'cc', 'country club']

const CATEGORY_MAP: Record<string, TerrainType> = {
  MT1: 'mountain',
  SW8: 'river',
  AT4: 'coastal',
}

export function detectTerrain(name: string, address: string, categoryCode?: string): TerrainType {
  if (categoryCode && CATEGORY_MAP[categoryCode]) {
    return CATEGORY_MAP[categoryCode]
  }

  const combined = `${name} ${address}`.toLowerCase()

  if (GOLF_KEYWORDS.some((k) => combined.includes(k))) return 'golf'
  if (MOUNTAIN_KEYWORDS.some((k) => combined.includes(k))) return 'mountain'
  if (COASTAL_KEYWORDS.some((k) => combined.includes(k))) return 'coastal'
  if (RIVER_KEYWORDS.some((k) => combined.includes(k))) return 'river'

  return 'urban'
}

export const TERRAIN_WIND_COEFFICIENT: Record<TerrainType, number> = {
  urban: 1.0,
  mountain: 1.8,
  coastal: 1.6,
  river: 1.4,
  golf: 1.3,
  park: 1.1,
  indoor: 0.0,
}

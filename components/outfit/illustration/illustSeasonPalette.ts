/**
 * 동적 복장 SVG용 계절 팔레트 (KST 달 기준)
 * 봄·여름·가을·겨울 무드 & HEX 참고
 */
export type IllustSeason = 'spring' | 'summer' | 'autumn' | 'winter'

/** 1–12, 미지정 시 봄 */
export function illustSeasonFromMonth(month?: number): IllustSeason {
  if (month == null || month < 1 || month > 12) return 'spring'
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

/** 세이지 그린 메인 + 음영 (상의 트렌디 톤) */
export const ILLUST_SAGE = '#84A59D'
const SAGE_SHADOW = '#6B857D'

/** 계절별로 같은 키를 두어 `CORE[season]` 접근 시 TS 유니온 오류를 피함 */
interface SeasonCore {
  blossom: string
  honeydew: string
  lemon: string
  white: string
  ocean: string
  sky: string
  coolGray: string
  burgundy: string
  burnt: string
  olive: string
  sand: string
  deep: string
  charcoal: string
  ice: string
  /** Sage Green — 차분·트렌디 상의 포인트 */
  sage: string
}

const CORE: Record<IllustSeason, SeasonCore> = {
  spring: {
    blossom: '#FFB7C5',
    honeydew: '#F0FFF0',
    lemon: '#FFF9C2',
    white: '#FFFFFF',
    ocean: '#5BA3C9',
    sky: '#C5E8F0',
    coolGray: '#E8EDF0',
    burgundy: '#B85C6A',
    burnt: '#E8A080',
    olive: '#8FA894',
    sand: '#F5EDE5',
    deep: '#3D4450',
    charcoal: '#6B7280',
    ice: '#D4E9FF',
    sage: ILLUST_SAGE,
  },
  summer: {
    blossom: '#FFB7C5',
    honeydew: '#E8FFF0',
    lemon: '#FFF9C2',
    white: '#FFFFFF',
    ocean: '#0077B6',
    sky: '#90E0EF',
    coolGray: '#E9ECEF',
    burgundy: '#8B2940',
    burnt: '#D97850',
    olive: '#6B7568',
    sand: '#E9E4DC',
    deep: '#1A1F24',
    charcoal: '#495057',
    ice: '#B8DCFA',
    sage: ILLUST_SAGE,
  },
  autumn: {
    blossom: '#E8A0B0',
    honeydew: '#E2EBE0',
    lemon: '#EDE5A8',
    white: '#F8F6F4',
    ocean: '#2A5F78',
    sky: '#7A9DA8',
    coolGray: '#CED4DA',
    burgundy: '#9A031E',
    burnt: '#E36414',
    olive: '#5F665C',
    sand: '#EDE4DC',
    deep: '#212529',
    charcoal: '#495057',
    ice: '#9EC4E8',
    sage: ILLUST_SAGE,
  },
  winter: {
    blossom: '#D4A0B0',
    honeydew: '#E0E8E4',
    lemon: '#E8E2C8',
    white: '#FFFFFF',
    ocean: '#1E5A7A',
    sky: '#7AB0CC',
    coolGray: '#DEE2E6',
    burgundy: '#7A1528',
    burnt: '#B85A30',
    olive: '#4A5248',
    sand: '#D5CEC6',
    deep: '#212529',
    charcoal: '#495057',
    ice: '#A2D2FF',
    sage: ILLUST_SAGE,
  },
}

export interface TopSeasonFill {
  main: string
  shadow: string
  trim: string
  collar: string
}

export function topSeasonFills(season: IllustSeason, variant: string): TopSeasonFill {
  const S = CORE[season]
  switch (variant) {
    case 'tshirt':
    case 'tank':
      if (season === 'spring')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.lemon, collar: S.white }
      if (season === 'summer')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.sky, collar: S.white }
      if (season === 'autumn')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.burnt, collar: S.sand }
      return { main: S.sage, shadow: SAGE_SHADOW, trim: S.ice, collar: S.white }
    case 'longsleeve':
    case 'knit':
      if (season === 'spring')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.blossom, collar: S.honeydew }
      if (season === 'summer')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.ocean, collar: S.coolGray }
      if (season === 'autumn')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.olive, collar: S.sand }
      return { main: S.sage, shadow: SAGE_SHADOW, trim: S.ice, collar: S.charcoal }
    case 'polo':
      if (season === 'spring')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.lemon, collar: '#E8F2EF' }
      if (season === 'summer')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.sky, collar: S.white }
      if (season === 'autumn')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.burnt, collar: S.sand }
      return { main: S.sage, shadow: SAGE_SHADOW, trim: S.ice, collar: S.white }
    case 'rashguard':
      if (season === 'spring')
        return { main: S.sage, shadow: SAGE_SHADOW, trim: S.blossom, collar: S.honeydew }
      if (season === 'summer')
        return { main: S.ocean, shadow: '#005A8C', trim: S.sky, collar: S.white }
      if (season === 'autumn')
        return { main: S.olive, shadow: S.burgundy, trim: S.burnt, collar: S.sand }
      return { main: S.charcoal, shadow: S.deep, trim: S.ice, collar: S.ice }
    default:
      return { main: '#94A3B8', shadow: '#64748B', trim: '#E2E8F0', collar: '#F8FAFC' }
  }
}

export interface MidSeasonFill {
  panel: string
  cuff: string
  detail: string
}

export function midSeasonFills(season: IllustSeason): MidSeasonFill {
  const S = CORE[season]
  if (season === 'spring')
    return { panel: '#D8EAE4', cuff: S.sage, detail: S.lemon }
  if (season === 'summer')
    return { panel: S.coolGray, cuff: S.sky, detail: S.ocean }
  if (season === 'autumn')
    return { panel: S.burnt, cuff: S.burgundy, detail: S.olive }
  return { panel: S.charcoal, cuff: S.deep, detail: S.ice }
}

export interface BottomSeasonFill {
  main: string
  seam: string
  belt?: string
}

export function bottomSeasonFills(season: IllustSeason, variant: string): BottomSeasonFill {
  const S = CORE[season]
  if (variant === 'shorts' || variant === 'skirt-mini') {
    if (season === 'spring') return { main: '#C5E3F6', seam: S.blossom }
    if (season === 'summer') return { main: S.sky, seam: S.ocean }
    if (season === 'autumn') return { main: S.burnt, seam: S.burgundy }
    return { main: S.charcoal, seam: S.ice }
  }
  if (variant === 'slacks') {
    if (season === 'spring') return { main: '#E8F5E9', seam: '#A5D6A7', belt: S.lemon }
    if (season === 'summer') return { main: S.coolGray, seam: '#ADB5BD', belt: S.ocean }
    if (season === 'autumn') return { main: S.sand, seam: S.olive, belt: S.burgundy }
    return { main: S.charcoal, seam: S.deep, belt: S.ice }
  }
  if (variant === 'midi-skirt') {
    if (season === 'spring') return { main: '#FBCFE8', seam: S.blossom }
    if (season === 'summer') return { main: S.sky, seam: S.ocean }
    if (season === 'autumn') return { main: '#C4A574', seam: S.burgundy }
    return { main: S.charcoal, seam: S.ice }
  }
  if (variant === 'dress') {
    if (season === 'spring') return { main: S.blossom, seam: S.lemon }
    if (season === 'summer') return { main: S.sky, seam: S.white }
    if (season === 'autumn') return { main: S.burnt, seam: S.olive }
    return { main: S.charcoal, seam: S.ice }
  }
  if (variant === 'ski-pants') {
    if (season === 'spring') return { main: '#2D3748', seam: S.blossom }
    if (season === 'summer') return { main: '#1F2937', seam: S.ocean }
    if (season === 'autumn') return { main: '#1A1A1A', seam: S.burnt }
    return { main: '#0D1117', seam: S.ice }
  }
  if (season === 'spring')
    return { main: '#B8C9B0', seam: '#7D9A8C', belt: S.lemon }
  if (season === 'summer')
    return { main: '#CED4DA', seam: '#ADB5BD', belt: S.ocean }
  if (season === 'autumn')
    return { main: S.olive, seam: '#3D4540', belt: S.burnt }
  return { main: S.deep, seam: S.charcoal, belt: S.ice }
}

export function footSeasonFills(season: IllustSeason): { upper: string; sole: string; stroke: string } {
  const S = CORE[season]
  if (season === 'spring')
    return { upper: S.white, sole: S.blossom, stroke: '#F9A8D4' }
  if (season === 'summer')
    return { upper: S.white, sole: S.sky, stroke: S.ocean }
  if (season === 'autumn')
    return { upper: S.sand, sole: S.olive, stroke: S.burnt }
  return { upper: S.charcoal, sole: S.deep, stroke: S.ice }
}

/** 신발 종류별 SVG 채움 (캐주얼·부츠·샌들 등) */
export interface FootLayerFill {
  upper: string
  sole: string
  accent: string
  deep?: string
}

export function footLayerFills(season: IllustSeason, variant: string): FootLayerFill {
  const S = CORE[season]
  const f = footSeasonFills(season)
  if (variant === 'sneaker' || variant === 'loafer' || variant === 'golf') {
    return { upper: f.upper, sole: f.sole, accent: f.stroke }
  }
  if (variant === 'boots' || variant === 'ankle-boots') {
    if (season === 'spring')
      return { upper: '#A16207', sole: '#92400E', accent: S.blossom, deep: '#78350F' }
    if (season === 'summer')
      return { upper: '#57534E', sole: '#44403C', accent: S.ocean, deep: '#292524' }
    if (season === 'autumn')
      return { upper: S.burgundy, sole: '#6B1D28', accent: S.burnt, deep: '#4A0F16' }
    return { upper: S.charcoal, sole: S.deep, accent: S.ice, deep: '#121416' }
  }
  if (variant === 'hiking') {
    if (season === 'spring')
      return { upper: '#3F3F46', sole: '#27272A', accent: S.honeydew, deep: '#18181B' }
    if (season === 'summer')
      return { upper: '#334155', sole: '#1E293B', accent: S.sky, deep: '#0F172A' }
    if (season === 'autumn')
      return { upper: S.olive, sole: '#3D4540', accent: S.burnt, deep: '#2A3028' }
    return { upper: S.deep, sole: '#0D1117', accent: S.ice, deep: '#000000' }
  }
  if (variant === 'sandal') {
    if (season === 'spring')
      return { upper: '#FB923C', sole: '#EA580C', accent: S.blossom }
    if (season === 'summer')
      return { upper: S.sky, sole: S.ocean, accent: S.white }
    if (season === 'autumn')
      return { upper: S.burnt, sole: S.burgundy, accent: S.olive }
    return { upper: S.charcoal, sole: S.deep, accent: S.ice }
  }
  if (variant === 'ski') {
    const accent =
      season === 'winter' ? S.ice : season === 'spring' ? S.blossom : season === 'summer' ? S.sky : S.burnt
    return { upper: '#111827', sole: '#1F2937', accent, deep: '#030712' }
  }
  if (variant === 'rain-boots') {
    if (season === 'spring')
      return { upper: S.lemon, sole: '#F59E0B', accent: S.blossom }
    if (season === 'summer')
      return { upper: S.sky, sole: S.ocean, accent: S.white }
    if (season === 'autumn')
      return { upper: S.burnt, sole: S.burgundy, accent: S.olive }
    return { upper: S.charcoal, sole: S.deep, accent: S.ice }
  }
  return { upper: f.upper, sole: f.sole, accent: f.stroke }
}

export function outerSeasonFills(season: IllustSeason): { main: string; deep: string; zip: string } {
  const S = CORE[season]
  if (season === 'spring')
    return { main: '#E8F8E8', deep: S.blossom, zip: S.lemon }
  if (season === 'summer')
    return { main: S.sky, deep: S.ocean, zip: S.white }
  if (season === 'autumn')
    return { main: S.olive, deep: S.burgundy, zip: S.burnt }
  return { main: S.charcoal, deep: S.deep, zip: S.ice }
}

import type { OutfitCategoryKey } from '@/lib/outfit/categories'
import type { OutfitAccessoryKey } from '@/lib/outfit/accessoryIllust'
import type { OutfitItem, OutfitResult, GenderType, OutfitWeatherSnapshot } from '@/types/outfit'

function pushUnique(map: Partial<Record<OutfitCategoryKey, OutfitAccessoryKey[]>>, cat: OutfitCategoryKey, key: OutfitAccessoryKey) {
  const row = map[cat] ?? (map[cat] = [])
  if (!row.includes(key)) row.push(key)
}

/** 추천 칩에 이미 같은 소재가 있으면 일러스트 탭 PNG는 생략 (목록 탭 `result.items`는 그대로) */
export function outfitItemCoversAccessoryIllust(items: OutfitItem[], key: OutfitAccessoryKey): boolean {
  switch (key) {
    case 'hatMale':
    case 'hatFemaleWide':
      return items.some(
        (it) =>
          it.category === 'acc' &&
          (it.name.includes('모자') ||
            it.name.includes('캡') ||
            it.name.includes('버킷') ||
            /-hat|hat-|acc-.*hat/i.test(it.id) ||
            it.icon === '👒' ||
            it.icon === '🧢'),
      )
    case 'sunglasses':
      return items.some(
        (it) => it.category === 'acc' && (it.name.includes('선글라스') || it.name.includes('고글') || it.icon === '🕶️'),
      )
    case 'gloves':
      return items.some((it) => it.category === 'acc' && (it.name.includes('장갑') || it.icon === '🧤'))
    case 'umbrellaOpen':
      return items.some(
        (it) =>
          it.category === 'rain' &&
          (it.name.includes('우산') || it.name.includes('우비') || it.name.includes('양산') || /umbrella/i.test(it.id)),
      )
    case 'windbreaker':
      return items.some(
        (it) =>
          (it.category === 'mid' || it.category === 'outer') &&
          (it.name.includes('바람막이') || it.name.includes('방풍') || it.name.includes('윈드') || /windbreaker|wind-/i.test(it.id)),
      )
    default:
      return false
  }
}

function stripAccessoryKeysAlreadyInItems(
  items: OutfitItem[],
  byCat: Partial<Record<OutfitCategoryKey, OutfitAccessoryKey[]>>,
): Partial<Record<OutfitCategoryKey, OutfitAccessoryKey[]>> {
  const out: Partial<Record<OutfitCategoryKey, OutfitAccessoryKey[]>> = {}
  for (const cat of Object.keys(byCat) as OutfitCategoryKey[]) {
    const keys = byCat[cat]
    if (!keys?.length) continue
    const next = keys.filter((k) => !outfitItemCoversAccessoryIllust(items, k))
    if (next.length) out[cat] = next
  }
  return out
}

/**
 * 날씨·복장 결과에 따라 좌우 `CategoryBlock` 행에 붙일 소품 키.
 * — `rain`: 우천 / 강수형태
 * — `mid`: 강풍 → 바람막이
 * — `acc`: 자외선·맑음 → 모자·선글라스, 한랭 → 장갑
 */
export function accessoriesByOutfitCategory(
  result: OutfitResult,
  gender: GenderType,
  weatherSky?: OutfitWeatherSnapshot,
  showSunshine?: boolean,
): Partial<Record<OutfitCategoryKey, OutfitAccessoryKey[]>> {
  const out: Partial<Record<OutfitCategoryKey, OutfitAccessoryKey[]>> = {}
  const pty = weatherSky?.ptyCode
  const precip = pty != null && pty !== '0'

  if (result.rainAlert || precip) {
    pushUnique(out, 'rain', 'umbrellaOpen')
  }
  if (result.windAlert) {
    pushUnique(out, 'mid', 'windbreaker')
  }

  const sunStrong = result.uvAlert || (showSunshine === true && (result.tempZone === 'hot' || result.tempZone === 'warm'))
  const sunMild = showSunshine === true && result.tempZone === 'mild' && !result.uvAlert

  if (sunStrong) {
    pushUnique(out, 'acc', gender === 'female' ? 'hatFemaleWide' : 'hatMale')
    pushUnique(out, 'acc', 'sunglasses')
  } else if (result.uvAlert || sunMild) {
    pushUnique(out, 'acc', 'sunglasses')
  }

  if (result.tempZone === 'cold' || result.tempZone === 'freezing') {
    pushUnique(out, 'acc', 'gloves')
  }

  return stripAccessoryKeysAlreadyInItems(result.items, out)
}

export const ACCESSORY_ALT: Record<OutfitAccessoryKey, string> = {
  umbrellaOpen: '우산',
  hatMale: '모자',
  hatFemaleWide: '모자',
  sunglasses: '선글라스',
  gloves: '장갑',
  windbreaker: '바람막이',
}

/** 일러스트 탭: 칩 대신 `public/outfit/accessories` PNG로 쓸 수 있으면 키 반환 */
export function outfitItemToAccessoryKey(item: OutfitItem, gender: GenderType): OutfitAccessoryKey | null {
  if (item.category === 'acc') {
    if (
      item.name.includes('모자') ||
      item.name.includes('캡') ||
      item.name.includes('버킷') ||
      /-hat|hat-|acc-.*hat/i.test(item.id) ||
      item.icon === '👒' ||
      item.icon === '🧢'
    ) {
      return gender === 'female' ? 'hatFemaleWide' : 'hatMale'
    }
    if (item.name.includes('선글라스') || item.name.includes('고글') || item.icon === '🕶️') {
      return 'sunglasses'
    }
    if (item.name.includes('장갑') || item.icon === '🧤') {
      return 'gloves'
    }
  }
  if (
    item.category === 'rain' &&
    (item.name.includes('우산') || item.name.includes('우비') || item.name.includes('양산') || /umbrella/i.test(item.id))
  ) {
    return 'umbrellaOpen'
  }
  if (
    (item.category === 'mid' || item.category === 'outer') &&
    (item.name.includes('바람막이') ||
      item.name.includes('방풍') ||
      item.name.includes('윈드') ||
      /windbreaker|wind-/i.test(item.id))
  ) {
    return 'windbreaker'
  }
  return null
}

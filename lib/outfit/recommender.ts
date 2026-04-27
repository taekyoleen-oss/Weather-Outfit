import type { OutfitInput, OutfitResult, OutfitItem } from '@/types/outfit'
import {
  getTempZone,
  TEMP_ZONE_LABELS,
  LAYER_LEVELS,
  getBaseItems,
  getActivityItems,
  pickHeroIllust,
  generateTips,
} from './rules'

export function recommendOutfit(input: OutfitInput): OutfitResult {
  const zone = getTempZone(input.feelsLike)

  // Collect all items
  const baseItems = getBaseItems(zone, input.gender, input.activity)
  const activityItems = getActivityItems(input.activity, zone, input.gender)

  // Deduplicate by id
  const seen = new Set<string>()
  const allItems: OutfitItem[] = []
  for (const item of [...baseItems, ...activityItems]) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      allItems.push(item)
    }
  }

  // Rain items
  const rainAlert = input.ptyCode !== '0'
  if (rainAlert) {
    if (input.ptyCode === '1' || input.ptyCode === '4') {
      allItems.push({ id: 'rain-umbrella', name: '우산', icon: '☂️', category: 'rain', required: true })
      allItems.push({ id: 'rain-coat', name: '우의 / 레인자켓', icon: '🌂', category: 'rain', required: false })
    } else if (input.ptyCode === '3' || input.ptyCode === '2') {
      allItems.push({ id: 'rain-boots', name: '방수 신발', icon: '🥾', category: 'foot', required: true })
    }
  }

  // Mask items
  const dustAlert = input.dustGrade === '3' || input.dustGrade === '4'
  if (dustAlert) {
    const maskLevel = input.dustGrade === '4' ? 'KF94' : 'KF80'
    allItems.push({
      id: 'mask-dust',
      name: `${maskLevel} 마스크`,
      icon: '😷',
      category: 'mask',
      required: input.dustGrade === '4',
    })
  }

  // Sun cream
  const uvAlert = input.uvIndex >= 6
  if (uvAlert) {
    allItems.push({ id: 'acc-suncream', name: 'SPF50+ 선크림', icon: '🧴', category: 'acc', required: input.uvIndex >= 8 })
  }

  // Wind alert
  const windAlert = input.windSpeed >= 10

  const heroIllust = pickHeroIllust(zone, input.activity, input.ptyCode)

  const tips = generateTips(
    zone,
    input.uvIndex,
    input.dustGrade,
    input.windSpeed,
    input.activity,
    input.terrain,
    input.duration
  )

  return {
    items: allItems,
    heroIllust,
    layerLevel: LAYER_LEVELS[zone],
    layerLabel: TEMP_ZONE_LABELS[zone],
    tempZone: zone,
    uvAlert,
    dustAlert,
    rainAlert,
    windAlert,
    tips,
  }
}

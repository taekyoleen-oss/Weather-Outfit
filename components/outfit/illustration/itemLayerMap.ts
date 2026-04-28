import type { OutfitItem, OutfitCategory } from '@/types/outfit'

export type TopVariant = 'tshirt' | 'longsleeve' | 'knit' | 'polo' | 'rashguard' | 'tank'
export type MidVariant = 'cardigan' | 'hoodie' | 'sweater' | 'vest'
export type OuterVariant = 'windbreaker' | 'jacket' | 'trench' | 'coat' | 'padding' | 'ski-jacket' | 'raincoat'
export type BottomVariant = 'shorts' | 'pants' | 'slacks' | 'warm-pants' | 'ski-pants' | 'skirt-mini' | 'midi-skirt' | 'dress'
export type FootVariant = 'sneaker' | 'loafer' | 'boots' | 'ankle-boots' | 'hiking' | 'sandal' | 'golf' | 'ski' | 'rain-boots'

export interface AccSet {
  hat: 'cap' | 'beanie' | 'sun-hat' | 'helmet' | 'headband' | null
  scarf: boolean
  gloves: boolean
  sunglasses: boolean
  goggles: boolean
  armsleeve: boolean
}

const TOP_MAP: Record<string, TopVariant> = {
  'top-tshirt':       'tshirt',
  'top-blouse':       'tshirt',
  'top-longsleeve':   'longsleeve',
  'top-longsleeve-f': 'longsleeve',
  'top-knit':         'knit',
  'top-shirt':        'longsleeve',
  'top-swimsuit':     'rashguard',
  'acc-rashguard':    'rashguard',
  'top-ski-inner':    'longsleeve',
  'top-golf-skirt':   'tshirt', // golf skirt is bottom, but if categorized top use fallback
}

const MID_MAP: Record<string, MidVariant> = {
  'mid-hoodie':          'hoodie',
  'mid-cardigan-light':  'cardigan',
  'mid-cardigan':        'cardigan',
  'mid-cardigan-f':      'cardigan',
  'mid-sweater':         'sweater',
  'mid-sweater-f':       'sweater',
  'mc-hiking-midlayer':  'cardigan',
  'mc-golf-windvest':    'vest',
}

const OUTER_MAP: Record<string, OuterVariant> = {
  'outer-jacket':             'jacket',
  'outer-jacket-f':           'jacket',
  'outer-coat':               'coat',
  'outer-coat-f':             'coat',
  'outer-padding':            'padding',
  'outer-ski-jacket':         'ski-jacket',
  'mc-river-windbreaker':     'windbreaker',
  'mc-river-windbreaker-mild':'windbreaker',
  'mc-hiking-windbreaker':    'windbreaker',
  'mc-beach-coverup':         'jacket',
}

const BOTTOM_MAP: Record<string, BottomVariant> = {
  'bottom-skirt-mini':      'skirt-mini',
  'bottom-dress':           'dress',
  'bottom-shorts-m':        'shorts',
  'bottom-linen-pants-f':   'pants',
  'bottom-midi-skirt':      'midi-skirt',
  'bottom-wide-pants':      'pants',
  'bottom-midi-skirt-mild': 'midi-skirt',
  'bottom-pants':           'pants',
  'bottom-slacks-f':        'slacks',
  'bottom-long-skirt':      'midi-skirt',
  'bottom-slacks-m':        'slacks',
  'bottom-warm-pants-f':    'warm-pants',
  'bottom-warm-pants':      'warm-pants',
  'bottom-ski-pants':       'ski-pants',
  'top-golf-skirt':         'slacks', // golf slacks/skirt treated as slacks
  'bottom-leggings-thermal':'pants',
}

const FOOT_MAP: Record<string, FootVariant> = {
  'foot-hiking':    'hiking',
  'foot-sneaker':   'sneaker',
  'foot-golf':      'golf',
  'foot-sandal':    'sandal',
  'foot-sandal-f':  'sandal',
  'foot-ski':       'ski',
  'foot-boots':     'boots',
  'foot-boots-f':   'ankle-boots',
  'foot-loafer':    'loafer',
}

// Rain-gear boots from rain category
const RAIN_BOOT_IDS = new Set(['rain-boots'])

function pickVariant<T>(map: Record<string, T>, items: OutfitItem[], category: OutfitCategory): T | null {
  const item = items.find((i) => i.category === category)
  if (!item) return null
  return map[item.id] ?? null
}

export function getTopVariant(items: OutfitItem[]): TopVariant {
  return (pickVariant(TOP_MAP, items, 'top') as TopVariant | null) ?? 'tshirt'
}

export function getMidVariant(items: OutfitItem[]): MidVariant | null {
  return pickVariant(MID_MAP, items, 'mid')
}

export function getOuterVariant(items: OutfitItem[]): OuterVariant | null {
  const v = pickVariant(OUTER_MAP, items, 'outer')
  if (v) return v
  // Check for rain coat from rain category
  const rainItem = items.find((i) => i.category === 'rain' && i.id.includes('jacket'))
  return rainItem ? 'raincoat' : null
}

export function getRainCoat(items: OutfitItem[]): boolean {
  return items.some((i) => i.category === 'rain')
}

export function getBottomVariant(items: OutfitItem[]): BottomVariant {
  return (pickVariant(BOTTOM_MAP, items, 'bottom') as BottomVariant | null) ?? 'pants'
}

export function getFootVariant(items: OutfitItem[]): FootVariant {
  return (pickVariant(FOOT_MAP, items, 'foot') as FootVariant | null) ?? 'sneaker'
}

export function getAccSet(items: OutfitItem[]): AccSet {
  const accItems = items.filter((i) => i.category === 'acc')
  const ids = new Set(accItems.map((i) => i.id))

  let hat: AccSet['hat'] = null
  if (ids.has('acc-helmet')) hat = 'helmet'
  else if (ids.has('acc-beaniehat-f') || ids.has('acc-earflap')) hat = 'beanie'
  else if (ids.has('acc-golf-hat')) hat = 'cap'
  else if (ids.has('acc-buff') || ids.has('acc-headband')) hat = 'headband'
  else if (ids.has('acc-hat-sun') || ids.has('acc-hat-sun-f') || ids.has('mc-beach-uvhat')) hat = 'sun-hat'

  const scarf = ids.has('acc-scarf') || ids.has('acc-scarf-f') || ids.has('acc-neckwarmer') || ids.has('mc-golf-coolingneck')
  const gloves = ids.has('acc-gloves') || ids.has('acc-gloves-f') || ids.has('acc-gloves-sport') || ids.has('acc-ski-gloves') || ids.has('acc-golf-glove')
  const sunglasses = ids.has('acc-sunglasses')
  const goggles = ids.has('acc-goggles')
  const armsleeve = ids.has('mc-golf-armsleeve')

  return { hat, scarf, gloves, sunglasses, goggles, armsleeve }
}

export function hasUmbrella(items: OutfitItem[]): boolean {
  return items.some((i) => i.category === 'rain' && !i.id.includes('jacket'))
}

export function hasMask(items: OutfitItem[]): boolean {
  return items.some((i) => i.category === 'mask')
}

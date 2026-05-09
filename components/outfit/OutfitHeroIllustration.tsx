import Image from 'next/image'
import type { HeroIllustKey, GenderType, OutfitWeatherSnapshot, TempZone } from '@/types/outfit'
import type { OutfitItem } from '@/types/outfit'
import { outfitCharacterImageSrc } from '@/lib/outfit/characterIllust'

interface Props {
  illustKey: HeroIllustKey
  size?: number
  /** 1–12, KST 달력. `fall-layered` 캡션만 봄/가을로 구분 */
  calendarMonth?: number
  /** 동적 모드: 추천 아이템 목록. 주어지면 캐릭터 PNG 등으로 렌더 */
  items?: OutfitItem[]
  gender?: GenderType
  /** 동적 모드에서 체감 구간별 캐릭터 에셋 선택 */
  tempZone?: TempZone
  large?: boolean
  /** 맑은 날 햇빛·광선 레이어 (동적 SVG일 때만) */
  showSunshine?: boolean
  weatherSky?: OutfitWeatherSnapshot
}

const ILLUST_LABELS: Record<HeroIllustKey, string> = {
  'summer-light': '여름 가벼운 코디',
  'summer-sport': '여름 스포츠 코디',
  'spring-mild':  '봄가을 선선한 코디',
  'fall-layered': '가을 레이어드 코디',
  'winter-heavy': '겨울 방한 코디',
  'rain-gear':    '우천 대비 코디',
  'snow-gear':    '눈·한파 코디',
  'beach-look':   '해변 코디',
  'ski-look':     '스키장 코디',
  'golf-look':    '골프 코디',
}

function heroLabel(illustKey: HeroIllustKey, calendarMonth?: number): string {
  if (illustKey !== 'fall-layered') return ILLUST_LABELS[illustKey]
  const m = calendarMonth
  if (m === 3 || m === 4 || m === 5) return '봄 레이어드 코디'
  if (m === 9 || m === 10 || m === 11) return '가을 레이어드 코디'
  if (m != null && m >= 1 && m <= 12) return '봄가을 레이어드 코디'
  return ILLUST_LABELS['fall-layered']
}

/** 캐릭터 이미지 표준 크기 (모든 이미지 686×1024로 크롭 통일) */
const CHAR_IMG_W = 686
const CHAR_IMG_H = 1024

export function OutfitHeroIllustration({
  illustKey,
  size = 180,
  calendarMonth,
  items,
  gender = 'male',
  tempZone = 'mild',
  large,
}: Props) {
  const label = heroLabel(illustKey, calendarMonth)
  const displaySize = large ? 320 : Math.round(size * 1.12)
  const frameClass = 'rounded-3xl flex items-center justify-center overflow-hidden'
  const framePadClass = large ? 'p-2' : 'px-0.5 py-1 sm:px-1.5 sm:py-2'
  const frameBaseStyle = {
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid var(--surface-border)',
    width: displaySize,
  } as const

  const charSrc = items != null ? outfitCharacterImageSrc(gender, tempZone) : null
  const altText = gender === 'female' ? `여성 복장 일러스트 — ${label}` : `남성 복장 일러스트 — ${label}`

  const characterImage = charSrc ? (
    <Image
      src={charSrc}
      alt={altText}
      width={CHAR_IMG_W}
      height={CHAR_IMG_H}
      className="h-auto w-full max-w-full"
      priority
    />
  ) : (
    <Image
      src={`/illust/outfit/${illustKey}.svg`}
      alt={label}
      width={200}
      height={296}
      className="h-auto w-full max-w-full"
      priority
    />
  )

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${frameClass} ${framePadClass}`} style={{ ...frameBaseStyle }}>
        {characterImage}
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
    </div>
  )
}

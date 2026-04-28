import Image from 'next/image'
import type { HeroIllustKey, GenderType } from '@/types/outfit'
import type { OutfitItem } from '@/types/outfit'
import { DynamicOutfitIllustration } from './illustration/DynamicOutfitIllustration'

interface Props {
  illustKey: HeroIllustKey
  size?: number
  /** 1–12, KST 달력. `fall-layered` 캡션만 봄/가을로 구분 */
  calendarMonth?: number
  /** 동적 모드: 추천 아이템 목록. 주어지면 인라인 SVG 합성으로 렌더 */
  items?: OutfitItem[]
  gender?: GenderType
  large?: boolean
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

export function OutfitHeroIllustration({ illustKey, size = 180, calendarMonth, items, gender = 'male', large }: Props) {
  const label = heroLabel(illustKey, calendarMonth)
  const displaySize = large ? 300 : size

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-3xl flex items-center justify-center overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid var(--surface-border)',
          width: displaySize,
          height: Math.round(displaySize * 1.2),
          padding: large ? 8 : 16,
        }}
      >
        {items && items.length > 0 ? (
          <DynamicOutfitIllustration
            items={items}
            illustKey={illustKey}
            gender={gender}
            size={displaySize - (large ? 16 : 32)}
          />
        ) : (
          <Image
            src={`/illust/outfit/${illustKey}.svg`}
            alt={label}
            width={displaySize - 32}
            height={displaySize - 32}
            priority
          />
        )}
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
    </div>
  )
}

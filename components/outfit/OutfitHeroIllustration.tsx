import Image from 'next/image'
import type { HeroIllustKey } from '@/types/outfit'

interface Props {
  illustKey: HeroIllustKey
  size?: number
  /** 1–12, KST 달력. `fall-layered` 캡션만 봄/가을로 구분 */
  calendarMonth?: number
}

const ILLUST_LABELS: Record<HeroIllustKey, string> = {
  'summer-light': '여름 가벼운 코디',
  'summer-sport': '여름 스포츠 코디',
  'spring-mild': '봄가을 선선한 코디',
  'fall-layered': '가을 레이어드 코디',
  'winter-heavy': '겨울 방한 코디',
  'rain-gear': '우천 대비 코디',
  'snow-gear': '눈·한파 코디',
  'beach-look': '해변 코디',
  'ski-look': '스키장 코디',
  'golf-look': '골프 코디',
}

function heroLabel(illustKey: HeroIllustKey, calendarMonth?: number): string {
  if (illustKey !== 'fall-layered') return ILLUST_LABELS[illustKey]
  const m = calendarMonth
  if (m === 3 || m === 4 || m === 5) return '봄 레이어드 코디'
  if (m === 9 || m === 10 || m === 11) return '가을 레이어드 코디'
  if (m != null && m >= 1 && m <= 12) return '봄가을 레이어드 코디'
  return ILLUST_LABELS['fall-layered']
}

export function OutfitHeroIllustration({ illustKey, size = 180, calendarMonth }: Props) {
  const label = heroLabel(illustKey, calendarMonth)
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-3xl p-4 flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid var(--surface-border)',
          width: size,
          height: size,
        }}
      >
        <Image
          src={`/illust/outfit/${illustKey}.svg`}
          alt={label}
          width={size - 32}
          height={size - 32}
          priority
        />
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
    </div>
  )
}

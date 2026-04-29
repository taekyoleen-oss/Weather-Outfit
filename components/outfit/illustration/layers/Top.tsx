import type { TopVariant } from '../itemLayerMap'
import { illustSeasonFromMonth, topSeasonFills } from '../illustSeasonPalette'

const SKIN = '#FDBA74'

interface Props {
  variant: TopVariant
  /** 1–12 KST 달 — 계절 팔레트용 */
  calendarMonth?: number
}

export function Top({ variant, calendarMonth }: Props) {
  const season = illustSeasonFromMonth(calendarMonth)
  const c = topSeasonFills(season, variant)

  switch (variant) {
    case 'tshirt':
      return (
        <g>
          {/* 반팔: 팔 노출 후 짧은 소매 상의 */}
          <path d="M58 76 L54 122 L80 122 L82 78 L66 70 Z" fill={SKIN} />
          <path d="M142 76 L146 122 L120 122 L118 78 L134 70 Z" fill={SKIN} />
          <path
            d="M82 78 L82 122 L118 122 L118 78 L120 74 L134 70 L126 52 Q114 46 100 51 Q86 46 74 52 L66 70 L80 74 Z"
            fill={c.main}
          />
          <path d="M74 52 L66 70 L80 74 L82 78 L118 78 L120 74 L134 70 L126 52 Q114 46 100 51 Q86 46 74 52Z" fill={c.shadow} opacity="0.35" />
          <path d="M91 51 Q100 60 109 51" stroke={c.collar} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M66 70 L80 74" stroke={c.trim} strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
          <path d="M134 70 L120 74" stroke={c.trim} strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
        </g>
      )
    case 'longsleeve':
      return (
        <g>
          {/* 긴팔: 소매·손목까지 덮임 (팔 노출 없음) */}
          <path d="M72 52 L60 82 L78 86 L78 122 L122 122 L122 86 L140 82 L128 52 Q114 46 100 51 Q86 46 72 52Z" fill={c.main} />
          <rect x="59" y="78" width="19" height="5" rx="2" fill={c.shadow} opacity="0.55" />
          <rect x="122" y="78" width="19" height="5" rx="2" fill={c.shadow} opacity="0.55" />
          <rect x="59" y="84" width="19" height="3" rx="1" fill={c.trim} opacity="0.35" />
          <rect x="122" y="84" width="19" height="3" rx="1" fill={c.trim} opacity="0.35" />
          <path d="M90 51 Q100 60 110 51" stroke={c.collar} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'knit':
      return (
        <g>
          <path d="M72 52 L60 82 L78 86 L78 122 L122 122 L122 86 L140 82 L128 52 Q114 46 100 51 Q86 46 72 52Z" fill={c.main} />
          <line x1="88" y1="62" x2="88" y2="118" stroke={c.shadow} strokeWidth="1" opacity="0.45" />
          <line x1="96" y1="62" x2="96" y2="118" stroke={c.shadow} strokeWidth="1" opacity="0.45" />
          <line x1="104" y1="62" x2="104" y2="118" stroke={c.shadow} strokeWidth="1" opacity="0.45" />
          <line x1="112" y1="62" x2="112" y2="118" stroke={c.shadow} strokeWidth="1" opacity="0.45" />
          <path d="M88 52 Q100 44 112 52 L112 58 Q100 52 88 58Z" fill={c.shadow} opacity="0.72" />
          <rect x="59" y="78" width="19" height="5" rx="2" fill={c.shadow} opacity="0.55" />
          <rect x="122" y="78" width="19" height="5" rx="2" fill={c.shadow} opacity="0.55" />
        </g>
      )
    case 'polo':
      return (
        <g>
          <ellipse cx="64" cy="78" rx="7" ry="14" fill={SKIN} opacity="0.95" />
          <ellipse cx="136" cy="78" rx="7" ry="14" fill={SKIN} opacity="0.95" />
          <path
            d="M74 55 L68 76 L85 81 L85 122 L115 122 L115 81 L132 76 L126 55 Q113 49 100 54 Q87 49 74 55Z"
            fill={c.main}
            stroke={c.shadow}
            strokeWidth="1"
          />
          <path d="M88 54 L88 62 L93 60 L100 65 L107 60 L112 62 L112 54" fill={c.trim} stroke={c.shadow} strokeWidth="0.5" />
          <circle cx="100" cy="70" r="1.8" fill={c.shadow} />
          <circle cx="100" cy="80" r="1.8" fill={c.shadow} />
          <rect x="68" y="72" width="17" height="4" fill={c.collar} opacity="0.45" />
          <rect x="115" y="72" width="17" height="4" fill={c.collar} opacity="0.45" />
        </g>
      )
    case 'rashguard':
      return (
        <g>
          <path d="M76 56 L70 74 L84 78 L84 115 L116 115 L116 78 L130 74 L124 56 Q112 50 100 55 Q88 50 76 56Z" fill={c.main} />
          <path d="M91 55 Q100 63 109 55" stroke={c.shadow} strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="84" y1="78" x2="84" y2="115" stroke={c.trim} strokeWidth="3" opacity="0.45" />
          <line x1="116" y1="78" x2="116" y2="115" stroke={c.trim} strokeWidth="3" opacity="0.45" />
        </g>
      )
    case 'tank':
      return (
        <g>
          <path d="M76 74 L72 118 L86 118 L88 76 L78 70 Z" fill={SKIN} />
          <path d="M124 74 L128 118 L114 118 L112 76 L122 70 Z" fill={SKIN} />
          <path d="M88 76 L86 118 L114 118 L112 76 L122 70 L130 70 L122 53 Q113 48 100 52 Q87 48 78 53 L70 70 L78 70 Z" fill={c.main} />
          <path d="M78 53 L70 70 L82 73 L82 62Z" fill={c.shadow} opacity="0.32" />
          <path d="M122 53 L130 70 L118 73 L118 62Z" fill={c.shadow} opacity="0.32" />
          <path d="M91 52 Q100 61 109 52" stroke={c.collar} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )
    default:
      return null
  }
}

import type { BottomVariant } from '../itemLayerMap'
import { illustSeasonFromMonth, bottomSeasonFills } from '../illustSeasonPalette'

const SKIN = '#FDBA74'

export function Bottom({ variant, calendarMonth }: { variant: BottomVariant; calendarMonth?: number }) {
  const b = bottomSeasonFills(illustSeasonFromMonth(calendarMonth), variant)

  switch (variant) {
    case 'shorts':
      return (
        <g>
          <path d="M80 122 L76 162 L98 162 L100 149 L102 162 L124 162 L120 122Z" fill={b.main} />
          <line x1="80" y1="128" x2="120" y2="128" stroke={b.seam} strokeWidth="1.5" opacity="0.5" />
          <path d="M111 131 L111 150 L120 150" stroke={b.seam} strokeWidth="1" fill="none" opacity="0.4" />
          <rect x="78" y="162" width="17" height="40" rx="4" fill={SKIN} />
          <rect x="105" y="162" width="17" height="40" rx="4" fill={SKIN} />
        </g>
      )
    case 'pants':
      return (
        <g>
          <path d="M80 122 L77 180 L96 180 L100 166 L104 180 L123 180 L120 122Z" fill={b.main} />
          <line x1="80" y1="130" x2="120" y2="130" stroke={b.seam} strokeWidth="1.5" opacity="0.5" />
        </g>
      )
    case 'slacks':
      return (
        <g>
          <path d="M85 122 L82 178 L98 178 L100 165 L102 178 L118 178 L115 122Z" fill={b.main} />
          <rect x="85" y="121" width="30" height="6" rx="1.5" fill={b.belt ?? b.seam} />
          <rect x="98" y="121" width="7" height="6" rx="1" fill={b.seam} />
          <line x1="90" y1="128" x2="88" y2="178" stroke={b.seam} strokeWidth="1" opacity="0.5" />
          <line x1="110" y1="128" x2="112" y2="178" stroke={b.seam} strokeWidth="1" opacity="0.5" />
        </g>
      )
    case 'warm-pants':
      return (
        <g>
          <path d="M79 132 L76 188 L97 188 L100 174 L103 188 L124 188 L121 132Z" fill={b.main} />
          <line x1="79" y1="140" x2="121" y2="140" stroke={b.seam} strokeWidth="2" opacity="0.6" />
          <line x1="79" y1="158" x2="121" y2="158" stroke={b.seam} strokeWidth="2" opacity="0.5" />
        </g>
      )
    case 'ski-pants':
      return (
        <g>
          <path d="M79 132 L76 186 L98 186 L100 172 L102 186 L124 186 L121 132Z" fill={b.main} />
          <line x1="79" y1="142" x2="121" y2="142" stroke={b.seam} strokeWidth="2" opacity="0.6" />
          <line x1="79" y1="132" x2="76" y2="186" stroke={b.seam} strokeWidth="2.5" opacity="0.55" />
          <line x1="121" y1="132" x2="124" y2="186" stroke={b.seam} strokeWidth="2.5" opacity="0.55" />
        </g>
      )
    case 'skirt-mini':
      return (
        <g>
          <path d="M82 122 L78 158 L122 158 L118 122Z" fill={b.main} />
          <line x1="82" y1="130" x2="118" y2="130" stroke={b.seam} strokeWidth="1" opacity="0.4" />
          <rect x="82" y="121" width="36" height="5" rx="2" fill={b.seam} opacity="0.55" />
          <rect x="79" y="158" width="17" height="42" rx="4" fill={SKIN} />
          <rect x="104" y="158" width="17" height="42" rx="4" fill={SKIN} />
        </g>
      )
    case 'midi-skirt':
      return (
        <g>
          <path d="M81 122 L75 190 L125 190 L119 122Z" fill={b.main} />
          <line x1="88" y1="130" x2="84" y2="188" stroke={b.seam} strokeWidth="1" opacity="0.35" />
          <line x1="100" y1="128" x2="100" y2="188" stroke={b.seam} strokeWidth="1" opacity="0.35" />
          <line x1="112" y1="130" x2="116" y2="188" stroke={b.seam} strokeWidth="1" opacity="0.35" />
          <rect x="81" y="121" width="38" height="5" rx="2" fill={b.seam} opacity="0.45" />
        </g>
      )
    case 'dress':
      return (
        <g>
          <path d="M76 54 L68 80 L82 86 L76 200 L124 200 L118 86 L132 80 L124 54 Q112 47 100 52 Q88 47 76 54Z" fill={b.main} />
          <line x1="80" y1="115" x2="120" y2="115" stroke={b.seam} strokeWidth="2" opacity="0.45" />
          <rect x="67" y="76" width="21" height="5" rx="2" fill={b.seam} opacity="0.4" />
          <rect x="112" y="76" width="21" height="5" rx="2" fill={b.seam} opacity="0.4" />
          <path d="M90 53 Q100 62 110 53" stroke={b.seam} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )
    default:
      return null
  }
}

import type { FootVariant } from '../itemLayerMap'
import { illustSeasonFromMonth, footLayerFills } from '../illustSeasonPalette'

const SKIN = '#FDBA74'

export function Foot({ variant, calendarMonth }: { variant: FootVariant; calendarMonth?: number }) {
  const F = footLayerFills(illustSeasonFromMonth(calendarMonth), variant)

  switch (variant) {
    case 'sneaker':
    case 'loafer':
      return (
        <g>
          <path
            d="M74 196 L74 208 Q74 214 82 215 L98 215 Q103 215 103 210 L103 196Z"
            fill={F.upper}
            stroke={F.accent}
            strokeWidth="1"
            strokeOpacity="0.45"
          />
          <path
            d="M101 196 L101 208 Q101 214 109 215 L125 215 Q130 215 130 210 L130 196Z"
            fill={F.upper}
            stroke={F.accent}
            strokeWidth="1"
            strokeOpacity="0.45"
          />
          <rect x="74" y="208" width="29" height="5" rx="2.5" fill={F.sole} />
          <rect x="101" y="208" width="29" height="5" rx="2.5" fill={F.sole} />
          <line x1="78" y1="202" x2="99" y2="202" stroke={F.accent} strokeWidth="1.5" strokeOpacity="0.5" />
          <line x1="105" y1="202" x2="126" y2="202" stroke={F.accent} strokeWidth="1.5" strokeOpacity="0.5" />
        </g>
      )
    case 'boots':
    case 'ankle-boots':
      return (
        <g>
          <path d="M73 183 L73 200 Q73 210 84 211 L98 211 Q103 210 103 205 L103 183Z" fill={F.deep ?? F.upper} />
          <path d="M99 183 L99 200 Q99 210 110 211 L124 211 Q129 210 129 205 L129 183Z" fill={F.deep ?? F.upper} />
          <rect x="73" y="183" width="30" height="6" rx="3" fill={F.upper} />
          <rect x="99" y="183" width="30" height="6" rx="3" fill={F.upper} />
          <line x1="80" y1="190" x2="80" y2="208" stroke={F.accent} strokeWidth="1" opacity="0.55" />
          <line x1="106" y1="190" x2="106" y2="208" stroke={F.accent} strokeWidth="1" opacity="0.55" />
        </g>
      )
    case 'hiking':
      return (
        <g>
          <path d="M72 183 L72 203 Q72 212 83 213 L98 213 Q104 212 104 206 L104 183Z" fill={F.upper} />
          <path d="M98 183 L98 203 Q98 212 109 213 L124 213 Q130 212 130 206 L130 183Z" fill={F.upper} />
          <rect x="72" y="183" width="32" height="7" rx="3" fill={F.sole} />
          <rect x="98" y="183" width="32" height="7" rx="3" fill={F.sole} />
          <line x1="78" y1="194" x2="98" y2="192" stroke={F.accent} strokeWidth="1.5" opacity="0.65" />
          <line x1="78" y1="200" x2="98" y2="198" stroke={F.accent} strokeWidth="1.5" opacity="0.65" />
          <line x1="104" y1="194" x2="124" y2="192" stroke={F.accent} strokeWidth="1.5" opacity="0.65" />
          <line x1="104" y1="200" x2="124" y2="198" stroke={F.accent} strokeWidth="1.5" opacity="0.65" />
          <rect x="72" y="207" width="32" height="5" rx="2" fill={F.deep ?? '#1C1917'} />
          <rect x="98" y="207" width="32" height="5" rx="2" fill={F.deep ?? '#1C1917'} />
        </g>
      )
    case 'sandal':
      return (
        <g>
          <path d="M77 194 L77 202 Q77 208 86 209 L102 209 Q106 208 106 204 L106 194Z" fill={F.upper} />
          <path d="M98 194 L98 202 Q98 208 107 209 L123 209 Q127 208 127 204 L127 194Z" fill={F.upper} />
          <line x1="83" y1="194" x2="100" y2="199" stroke={F.accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="88" y1="194" x2="100" y2="202" stroke={F.accent} strokeWidth="2" strokeLinecap="round" />
          <line x1="104" y1="194" x2="117" y2="199" stroke={F.accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="109" y1="194" x2="117" y2="202" stroke={F.accent} strokeWidth="2" strokeLinecap="round" />
          <rect x="80" y="186" width="20" height="10" rx="4" fill={SKIN} />
          <rect x="102" y="186" width="20" height="10" rx="4" fill={SKIN} />
        </g>
      )
    case 'golf':
      return (
        <g>
          <path
            d="M78 189 C82 184, 95 184, 101 188 L104 196 C103 200, 96 202, 88 202 L79 201 C76 200, 76 194, 78 189 Z"
            fill={F.upper}
            stroke={F.accent}
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
          <path
            d="M98 189 C102 184, 115 184, 121 188 L124 196 C123 200, 116 202, 108 202 L99 201 C96 200, 96 194, 98 189 Z"
            fill={F.upper}
            stroke={F.accent}
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
          <path d="M77 199 L104 199" stroke={F.sole} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M97 199 L124 199" stroke={F.sole} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M84 193 L99 193" stroke={F.accent} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
          <path d="M104 193 L119 193" stroke={F.accent} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        </g>
      )
    case 'ski':
      return (
        <g>
          <path d="M72 183 L72 202 Q72 210 84 211 L100 211 Q106 210 106 205 L106 183Z" fill={F.upper} />
          <path d="M98 183 L98 202 Q98 210 110 211 L126 211 Q132 210 132 205 L132 183Z" fill={F.upper} />
          <rect x="72" y="183" width="34" height="8" rx="4" fill={F.sole} />
          <rect x="98" y="183" width="34" height="8" rx="4" fill={F.sole} />
          <rect x="80" y="194" width="18" height="3" rx="1" fill={F.accent} opacity="0.85" />
          <rect x="106" y="194" width="18" height="3" rx="1" fill={F.accent} opacity="0.85" />
          <rect x="80" y="202" width="18" height="3" rx="1" fill={F.accent} opacity="0.55" />
          <rect x="106" y="202" width="18" height="3" rx="1" fill={F.accent} opacity="0.55" />
          <rect x="62" y="209" width="48" height="5" rx="2.5" fill={F.deep ?? '#475569'} />
          <rect x="90" y="209" width="48" height="5" rx="2.5" fill={F.deep ?? '#475569'} />
        </g>
      )
    case 'rain-boots':
      return (
        <g>
          <path d="M76 177 L76 196 Q76 208 87 209 L100 209 Q105 208 105 203 L105 177Z" fill={F.upper} />
          <path d="M99 177 L99 196 Q99 208 110 209 L123 209 Q128 208 128 203 L128 177Z" fill={F.upper} />
          <rect x="76" y="177" width="29" height="7" rx="3" fill={F.sole} />
          <rect x="99" y="177" width="29" height="7" rx="3" fill={F.sole} />
          <rect x="76" y="202" width="29" height="6" rx="3" fill={F.accent} opacity="0.35" />
          <rect x="99" y="202" width="29" height="6" rx="3" fill={F.accent} opacity="0.35" />
        </g>
      )
    default:
      return null
  }
}

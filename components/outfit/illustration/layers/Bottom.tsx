import type { BottomVariant } from '../itemLayerMap'

export function Bottom({ variant }: { variant: BottomVariant }) {
  switch (variant) {
    case 'shorts':
      return (
        <g>
          {/* Denim shorts */}
          <path d="M80 122 L76 162 L98 162 L100 149 L102 162 L124 162 L120 122Z" fill="#60A5FA"/>
          <line x1="80" y1="128" x2="120" y2="128" stroke="#3B82F6" strokeWidth="1.5" opacity="0.5"/>
          <path d="M111 131 L111 150 L120 150" stroke="#3B82F6" strokeWidth="1" fill="none" opacity="0.4"/>
          {/* Bare legs */}
          <rect x="78" y="162" width="17" height="40" rx="4" fill="#FDBA74"/>
          <rect x="105" y="162" width="17" height="40" rx="4" fill="#FDBA74"/>
        </g>
      )
    case 'pants':
      return (
        <g>
          {/* Casual pants / wide pants */}
          <path d="M80 122 L77 180 L96 180 L100 166 L104 180 L123 180 L120 122Z" fill="#334155"/>
          <line x1="80" y1="130" x2="120" y2="130" stroke="#475569" strokeWidth="1.5" opacity="0.5"/>
        </g>
      )
    case 'slacks':
      return (
        <g>
          {/* Dress slacks / gray trousers */}
          <path d="M85 122 L82 178 L98 178 L100 165 L102 178 L118 178 L115 122Z" fill="#D1D5DB"/>
          {/* Belt */}
          <rect x="85" y="121" width="30" height="6" rx="1.5" fill="#92400E"/>
          <rect x="98" y="121" width="7" height="6" rx="1" fill="#78350F"/>
          {/* Pant crease */}
          <line x1="90" y1="128" x2="88" y2="178" stroke="#9CA3AF" strokeWidth="1" opacity="0.5"/>
          <line x1="110" y1="128" x2="112" y2="178" stroke="#9CA3AF" strokeWidth="1" opacity="0.5"/>
        </g>
      )
    case 'warm-pants':
      return (
        <g>
          {/* Thick / fleece-lined pants */}
          <path d="M79 132 L76 188 L97 188 L100 174 L103 188 L124 188 L121 132Z" fill="#111827"/>
          <line x1="79" y1="140" x2="121" y2="140" stroke="#1F2937" strokeWidth="2" opacity="0.6"/>
          <line x1="79" y1="158" x2="121" y2="158" stroke="#1F2937" strokeWidth="2" opacity="0.5"/>
        </g>
      )
    case 'ski-pants':
      return (
        <g>
          {/* Ski pants / insulated trousers */}
          <path d="M79 132 L76 186 L98 186 L100 172 L102 186 L124 186 L121 132Z" fill="#1F2937"/>
          <line x1="79" y1="142" x2="121" y2="142" stroke="#374151" strokeWidth="2" opacity="0.6"/>
          {/* Side stripe */}
          <line x1="79" y1="132" x2="76" y2="186" stroke="#DC2626" strokeWidth="2.5" opacity="0.5"/>
          <line x1="121" y1="132" x2="124" y2="186" stroke="#DC2626" strokeWidth="2.5" opacity="0.5"/>
        </g>
      )
    case 'skirt-mini':
      return (
        <g>
          {/* Mini skirt */}
          <path d="M82 122 L78 158 L122 158 L118 122Z" fill="#EC4899"/>
          <line x1="82" y1="130" x2="118" y2="130" stroke="#DB2777" strokeWidth="1" opacity="0.4"/>
          {/* Waistband */}
          <rect x="82" y="121" width="36" height="5" rx="2" fill="#DB2777" opacity="0.6"/>
          {/* Bare legs */}
          <rect x="79" y="158" width="17" height="42" rx="4" fill="#FDBA74"/>
          <rect x="104" y="158" width="17" height="42" rx="4" fill="#FDBA74"/>
        </g>
      )
    case 'midi-skirt':
      return (
        <g>
          {/* Midi/long skirt */}
          <path d="M81 122 L75 190 L125 190 L119 122Z" fill="#A78BFA"/>
          {/* Flow lines */}
          <line x1="88" y1="130" x2="84" y2="188" stroke="#7C3AED" strokeWidth="1" opacity="0.3"/>
          <line x1="100" y1="128" x2="100" y2="188" stroke="#7C3AED" strokeWidth="1" opacity="0.3"/>
          <line x1="112" y1="130" x2="116" y2="188" stroke="#7C3AED" strokeWidth="1" opacity="0.3"/>
          {/* Waistband */}
          <rect x="81" y="121" width="38" height="5" rx="2" fill="#7C3AED" opacity="0.5"/>
        </g>
      )
    case 'dress':
      return (
        <g>
          {/* Simple dress (used when dress replaces top+bottom) */}
          <path d="M76 54 L68 80 L82 86 L76 200 L124 200 L118 86 L132 80 L124 54 Q112 47 100 52 Q88 47 76 54Z" fill="#F9A8D4"/>
          {/* Waist cinch */}
          <line x1="80" y1="115" x2="120" y2="115" stroke="#EC4899" strokeWidth="2" opacity="0.4"/>
          {/* Sleeve cuffs */}
          <rect x="67" y="76" width="21" height="5" rx="2" fill="#EC4899" opacity="0.4"/>
          <rect x="112" y="76" width="21" height="5" rx="2" fill="#EC4899" opacity="0.4"/>
          {/* Neckline */}
          <path d="M90 53 Q100 62 110 53" stroke="#EC4899" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </g>
      )
    default:
      return null
  }
}

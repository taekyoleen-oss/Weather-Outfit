import type { FootVariant } from '../itemLayerMap'

export function Foot({ variant }: { variant: FootVariant }) {
  switch (variant) {
    case 'sneaker':
    case 'loafer':
      return (
        <g>
          {/* White sneakers / loafers */}
          <path d="M74 196 L74 208 Q74 214 82 215 L98 215 Q103 215 103 210 L103 196Z" fill="white" stroke="#CBD5E1" strokeWidth="1"/>
          <path d="M101 196 L101 208 Q101 214 109 215 L125 215 Q130 215 130 210 L130 196Z" fill="white" stroke="#CBD5E1" strokeWidth="1"/>
          <rect x="74" y="208" width="29" height="5" rx="2.5" fill="#94A3B8"/>
          <rect x="101" y="208" width="29" height="5" rx="2.5" fill="#94A3B8"/>
          <line x1="78" y1="202" x2="99" y2="202" stroke="#CBD5E1" strokeWidth="1.5"/>
          <line x1="105" y1="202" x2="126" y2="202" stroke="#CBD5E1" strokeWidth="1.5"/>
        </g>
      )
    case 'boots':
    case 'ankle-boots':
      return (
        <g>
          {/* Ankle boots — warm brown */}
          <path d="M73 183 L73 200 Q73 210 84 211 L98 211 Q103 210 103 205 L103 183Z" fill="#78350F"/>
          <path d="M99 183 L99 200 Q99 210 110 211 L124 211 Q129 210 129 205 L129 183Z" fill="#78350F"/>
          <rect x="73" y="183" width="30" height="6" rx="3" fill="#92400E"/>
          <rect x="99" y="183" width="30" height="6" rx="3" fill="#92400E"/>
          <line x1="80" y1="190" x2="80" y2="208" stroke="#A16207" strokeWidth="1" opacity="0.5"/>
          <line x1="106" y1="190" x2="106" y2="208" stroke="#A16207" strokeWidth="1" opacity="0.5"/>
        </g>
      )
    case 'hiking':
      return (
        <g>
          {/* Hiking boots — dark brown, chunky */}
          <path d="M72 183 L72 203 Q72 212 83 213 L98 213 Q104 212 104 206 L104 183Z" fill="#292524"/>
          <path d="M98 183 L98 203 Q98 212 109 213 L124 213 Q130 212 130 206 L130 183Z" fill="#292524"/>
          <rect x="72" y="183" width="32" height="7" rx="3" fill="#44403C"/>
          <rect x="98" y="183" width="32" height="7" rx="3" fill="#44403C"/>
          {/* Lace lines */}
          <line x1="78" y1="194" x2="98" y2="192" stroke="#78716C" strokeWidth="1.5"/>
          <line x1="78" y1="200" x2="98" y2="198" stroke="#78716C" strokeWidth="1.5"/>
          <line x1="104" y1="194" x2="124" y2="192" stroke="#78716C" strokeWidth="1.5"/>
          <line x1="104" y1="200" x2="124" y2="198" stroke="#78716C" strokeWidth="1.5"/>
          {/* Sole */}
          <rect x="72" y="207" width="32" height="5" rx="2" fill="#1C1917"/>
          <rect x="98" y="207" width="32" height="5" rx="2" fill="#1C1917"/>
        </g>
      )
    case 'sandal':
      return (
        <g>
          {/* Sandals / flip-flops */}
          <path d="M77 194 L77 202 Q77 208 86 209 L102 209 Q106 208 106 204 L106 194Z" fill="#D97706"/>
          <path d="M98 194 L98 202 Q98 208 107 209 L123 209 Q127 208 127 204 L127 194Z" fill="#D97706"/>
          {/* Sandal straps */}
          <line x1="83" y1="194" x2="100" y2="199" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="88" y1="194" x2="100" y2="202" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
          <line x1="104" y1="194" x2="117" y2="199" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="109" y1="194" x2="117" y2="202" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
          {/* Bare feet toes hint */}
          <rect x="80" y="186" width="20" height="10" rx="4" fill="#FDBA74"/>
          <rect x="102" y="186" width="20" height="10" rx="4" fill="#FDBA74"/>
        </g>
      )
    case 'golf':
      return (
        <g>
          {/* Golf shoes: simple sneaker-like silhouette */}
          <path d="M78 189 C82 184, 95 184, 101 188 L104 196 C103 200, 96 202, 88 202 L79 201 C76 200, 76 194, 78 189 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2"/>
          <path d="M98 189 C102 184, 115 184, 121 188 L124 196 C123 200, 116 202, 108 202 L99 201 C96 200, 96 194, 98 189 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2"/>
          <path d="M77 199 L104 199" stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M97 199 L124 199" stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M84 193 L99 193" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M104 193 L119 193" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/>
        </g>
      )
    case 'ski':
      return (
        <g>
          {/* Ski boots — stiff dark */}
          <path d="M72 183 L72 202 Q72 210 84 211 L100 211 Q106 210 106 205 L106 183Z" fill="#111827"/>
          <path d="M98 183 L98 202 Q98 210 110 211 L126 211 Q132 210 132 205 L132 183Z" fill="#111827"/>
          <rect x="72" y="183" width="34" height="8" rx="4" fill="#1F2937"/>
          <rect x="98" y="183" width="34" height="8" rx="4" fill="#1F2937"/>
          {/* Boot buckles */}
          <rect x="80" y="194" width="18" height="3" rx="1" fill="#374151"/>
          <rect x="106" y="194" width="18" height="3" rx="1" fill="#374151"/>
          <rect x="80" y="202" width="18" height="3" rx="1" fill="#374151"/>
          <rect x="106" y="202" width="18" height="3" rx="1" fill="#374151"/>
          {/* Skis */}
          <rect x="62" y="209" width="48" height="5" rx="2.5" fill="#475569"/>
          <rect x="90" y="209" width="48" height="5" rx="2.5" fill="#475569"/>
        </g>
      )
    case 'rain-boots':
      return (
        <g>
          {/* Yellow rain boots */}
          <path d="M76 177 L76 196 Q76 208 87 209 L100 209 Q105 208 105 203 L105 177Z" fill="#FCD34D"/>
          <path d="M99 177 L99 196 Q99 208 110 209 L123 209 Q128 208 128 203 L128 177Z" fill="#FCD34D"/>
          <rect x="76" y="177" width="29" height="7" rx="3" fill="#F59E0B"/>
          <rect x="99" y="177" width="29" height="7" rx="3" fill="#F59E0B"/>
          <rect x="76" y="202" width="29" height="6" rx="3" fill="#78350F" opacity="0.3"/>
          <rect x="99" y="202" width="29" height="6" rx="3" fill="#78350F" opacity="0.3"/>
        </g>
      )
    default:
      return null
  }
}

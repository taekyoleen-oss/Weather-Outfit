import type { MidVariant } from '../itemLayerMap'

export function Mid({ variant }: { variant: MidVariant | null }) {
  if (!variant) return null

  switch (variant) {
    case 'cardigan':
      return (
        <g>
          {/* Open cardigan over shirt — only front panels + sleeves visible */}
          {/* Left panel */}
          <path d="M64 52 L56 78 L78 84 L78 122 L94 122 L94 62 Q80 56 64 52Z" fill="#CA8A04" opacity="0.92"/>
          {/* Right panel */}
          <path d="M136 52 L144 78 L122 84 L122 122 L106 122 L106 62 Q120 56 136 52Z" fill="#CA8A04" opacity="0.92"/>
          {/* Sleeve cuffs */}
          <rect x="55" y="74" width="21" height="5" rx="2" fill="#A16207" opacity="0.5"/>
          <rect x="124" y="74" width="21" height="5" rx="2" fill="#A16207" opacity="0.5"/>
          {/* Collar/lapel */}
          <path d="M94 62 L90 52 L100 58Z" fill="#A16207" opacity="0.4"/>
          <path d="M106 62 L110 52 L100 58Z" fill="#A16207" opacity="0.4"/>
        </g>
      )
    case 'hoodie':
      return (
        <g>
          {/* Hoodie over shirt */}
          <path d="M66 52 L58 80 L79 86 L79 122 L121 122 L121 86 L142 80 L134 52 Q118 46 100 51 Q82 46 66 52Z" fill="#6B7280"/>
          {/* Hood behind head */}
          <path d="M82 50 Q82 36 100 34 Q118 36 118 50 L116 52 Q116 40 100 38 Q84 40 84 52Z" fill="#4B5563" opacity="0.6"/>
          {/* Kangaroo pocket */}
          <rect x="85" y="104" width="30" height="14" rx="3" fill="#4B5563" opacity="0.4"/>
          {/* Sleeve cuffs */}
          <rect x="57" y="76" width="21" height="5" rx="2" fill="#4B5563" opacity="0.5"/>
          <rect x="122" y="76" width="21" height="5" rx="2" fill="#4B5563" opacity="0.5"/>
          {/* Front drawstring opening */}
          <path d="M96 52 Q100 56 104 52" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>
      )
    case 'sweater':
      return (
        <g>
          {/* Thick sweater/knit */}
          <path d="M68 52 L60 80 L79 86 L79 122 L121 122 L121 86 L140 80 L132 52 Q116 46 100 51 Q84 46 68 52Z" fill="#9F4E3A"/>
          {/* Knit ribbing lines */}
          <line x1="79" y1="66" x2="121" y2="66" stroke="#7F3D2E" strokeWidth="1.5" opacity="0.5"/>
          <line x1="79" y1="78" x2="121" y2="78" stroke="#7F3D2E" strokeWidth="1.5" opacity="0.5"/>
          <line x1="79" y1="90" x2="121" y2="90" stroke="#7F3D2E" strokeWidth="1.5" opacity="0.5"/>
          <line x1="79" y1="102" x2="121" y2="102" stroke="#7F3D2E" strokeWidth="1.5" opacity="0.5"/>
          <line x1="79" y1="114" x2="121" y2="114" stroke="#7F3D2E" strokeWidth="1.5" opacity="0.5"/>
          {/* Sleeve cuffs */}
          <rect x="59" y="76" width="21" height="6" rx="3" fill="#7F3D2E" opacity="0.5"/>
          <rect x="120" y="76" width="21" height="6" rx="3" fill="#7F3D2E" opacity="0.5"/>
          {/* Crew neck */}
          <path d="M88 51 Q100 59 112 51" stroke="#7F3D2E" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </g>
      )
    case 'vest':
      return (
        <g>
          {/* Sleeveless windvest / knit vest */}
          <path d="M78 52 L78 122 L122 122 L122 52 Q112 46 100 51 Q88 46 78 52Z" fill="#3B82F6" opacity="0.85"/>
          {/* Zip */}
          <rect x="98" y="56" width="4" height="62" rx="2" fill="#2563EB" opacity="0.4"/>
          {/* Collar */}
          <path d="M88 52 Q100 60 112 52" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </g>
      )
    default:
      return null
  }
}

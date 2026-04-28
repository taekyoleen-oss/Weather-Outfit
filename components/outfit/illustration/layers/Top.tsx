import type { TopVariant } from '../itemLayerMap'

export function Top({ variant }: { variant: TopVariant }) {
  switch (variant) {
    case 'tshirt':
      return (
        <g>
          {/* Short-sleeve t-shirt */}
          <path d="M74 52 L66 70 L82 75 L82 122 L118 122 L118 75 L134 70 L126 52 Q114 46 100 51 Q86 46 74 52Z" fill="#60A5FA"/>
          {/* Sleeve shadow */}
          <path d="M74 52 L66 70 L80 73 L80 62Z" fill="#3B82F6" opacity="0.25"/>
          <path d="M126 52 L134 70 L120 73 L120 62Z" fill="#3B82F6" opacity="0.25"/>
          {/* Round collar */}
          <path d="M91 51 Q100 60 109 51" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </g>
      )
    case 'longsleeve':
      return (
        <g>
          {/* Long-sleeve shirt */}
          <path d="M72 52 L60 82 L78 86 L78 122 L122 122 L122 86 L140 82 L128 52 Q114 46 100 51 Q86 46 72 52Z" fill="#6366F1"/>
          {/* Sleeve cuffs */}
          <rect x="59" y="78" width="19" height="5" rx="2" fill="#4F46E5" opacity="0.5"/>
          <rect x="122" y="78" width="19" height="5" rx="2" fill="#4F46E5" opacity="0.5"/>
          {/* Crew collar */}
          <path d="M90 51 Q100 60 110 51" stroke="#4F46E5" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </g>
      )
    case 'knit':
      return (
        <g>
          {/* Knit sweater / turtleneck */}
          <path d="M72 52 L60 82 L78 86 L78 122 L122 122 L122 86 L140 82 L128 52 Q114 46 100 51 Q86 46 72 52Z" fill="#8B5CF6"/>
          {/* Knit texture lines */}
          <line x1="88" y1="62" x2="88" y2="118" stroke="#7C3AED" strokeWidth="1" opacity="0.4"/>
          <line x1="96" y1="62" x2="96" y2="118" stroke="#7C3AED" strokeWidth="1" opacity="0.4"/>
          <line x1="104" y1="62" x2="104" y2="118" stroke="#7C3AED" strokeWidth="1" opacity="0.4"/>
          <line x1="112" y1="62" x2="112" y2="118" stroke="#7C3AED" strokeWidth="1" opacity="0.4"/>
          {/* Turtle neck */}
          <path d="M88 52 Q100 44 112 52 L112 58 Q100 52 88 58Z" fill="#7C3AED" opacity="0.7"/>
          {/* Sleeve cuffs */}
          <rect x="59" y="78" width="19" height="5" rx="2" fill="#7C3AED" opacity="0.5"/>
          <rect x="122" y="78" width="19" height="5" rx="2" fill="#7C3AED" opacity="0.5"/>
        </g>
      )
    case 'polo':
      return (
        <g>
          {/* White polo shirt */}
          <path d="M74 55 L68 76 L85 81 L85 122 L115 122 L115 81 L132 76 L126 55 Q113 49 100 54 Q87 49 74 55Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1"/>
          {/* Polo collar */}
          <path d="M88 54 L88 62 L93 60 L100 65 L107 60 L112 62 L112 54" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.5"/>
          {/* Polo buttons */}
          <circle cx="100" cy="70" r="1.8" fill="#CBD5E1"/>
          <circle cx="100" cy="80" r="1.8" fill="#CBD5E1"/>
          {/* Green sleeve stripe */}
          <rect x="68" y="72" width="17" height="4" fill="#15803D" opacity="0.4"/>
          <rect x="115" y="72" width="17" height="4" fill="#15803D" opacity="0.4"/>
        </g>
      )
    case 'rashguard':
      return (
        <g>
          {/* Teal rashguard */}
          <path d="M76 56 L70 74 L84 78 L84 115 L116 115 L116 78 L130 74 L124 56 Q112 50 100 55 Q88 50 76 56Z" fill="#0D9488"/>
          {/* Rashguard collar */}
          <path d="M91 55 Q100 63 109 55" stroke="#0F766E" strokeWidth="2" fill="none" strokeLinecap="round"/>
          {/* Side stripe */}
          <line x1="84" y1="78" x2="84" y2="115" stroke="#14B8A6" strokeWidth="3" opacity="0.4"/>
          <line x1="116" y1="78" x2="116" y2="115" stroke="#14B8A6" strokeWidth="3" opacity="0.4"/>
        </g>
      )
    case 'tank':
      return (
        <g>
          {/* Sports tank / running top */}
          <path d="M78 53 L70 70 L85 74 L85 118 L115 118 L115 74 L130 70 L122 53 Q113 48 100 52 Q87 48 78 53Z" fill="#4ADE80"/>
          {/* Racerback shadow */}
          <path d="M78 53 L70 70 L82 73 L82 62Z" fill="#16A34A" opacity="0.3"/>
          <path d="M122 53 L130 70 L118 73 L118 62Z" fill="#16A34A" opacity="0.3"/>
          {/* Round neckline */}
          <path d="M91 52 Q100 61 109 52" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          {/* Side stripe */}
          <line x1="85" y1="74" x2="85" y2="118" stroke="white" strokeWidth="2" opacity="0.4"/>
          <line x1="115" y1="74" x2="115" y2="118" stroke="white" strokeWidth="2" opacity="0.4"/>
        </g>
      )
    default:
      return null
  }
}

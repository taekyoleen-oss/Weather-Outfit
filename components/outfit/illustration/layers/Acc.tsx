import type { AccSet } from '../itemLayerMap'

interface AccHatProps {
  hat: AccSet['hat']
}

/** Drawn BEFORE Body so the head circle overlaps the lower part of hat/beanie */
export function AccHat({ hat }: AccHatProps) {
  if (!hat) return null

  switch (hat) {
    case 'beanie':
      return (
        <g>
          <path d="M82 22 Q82 6 100 4 Q118 6 118 22 Q112 12 100 11 Q88 12 82 22Z" fill="#1E293B"/>
          <rect x="82" y="22" width="36" height="8" rx="2" fill="#334155"/>
          <circle cx="100" cy="8" r="5" fill="#DBEAFE"/>
        </g>
      )
    case 'cap':
      return (
        <g>
          {/* Golf/sport cap */}
          <path d="M80 24 Q80 10 100 8 Q120 10 120 24 Q113 15 100 14 Q87 15 80 24Z" fill="#166534"/>
          <rect x="80" y="24" width="40" height="9" rx="2" fill="#15803D"/>
          {/* Brim */}
          <path d="M80 32 Q90 36 100 36 Q110 36 120 32 L118 34 Q110 39 100 39 Q90 39 82 34Z" fill="#166534"/>
          <circle cx="100" cy="11" r="3" fill="#14532D"/>
        </g>
      )
    case 'sun-hat':
      return (
        <g>
          {/* Wide brim sun hat */}
          <ellipse cx="100" cy="20" rx="34" ry="9" fill="#D97706" opacity="0.9"/>
          <ellipse cx="100" cy="15" rx="20" ry="12" fill="#F59E0B"/>
          {/* Hat ribbon */}
          <rect x="80" y="22" width="40" height="4" fill="#EF4444" opacity="0.7"/>
          {/* Crown top */}
          <ellipse cx="100" cy="10" rx="18" ry="7" fill="#FBBF24" opacity="0.7"/>
        </g>
      )
    case 'helmet':
      return (
        <g>
          {/* Ski helmet — dark */}
          <path d="M82 22 Q82 5 100 4 Q118 5 118 22 Q112 12 100 11 Q88 12 82 22Z" fill="#1E293B"/>
          <rect x="82" y="22" width="36" height="7" rx="2" fill="#334155"/>
          {/* Ventilation lines */}
          <line x1="88" y1="14" x2="88" y2="20" stroke="#475569" strokeWidth="1.5" opacity="0.6"/>
          <line x1="94" y1="12" x2="94" y2="19" stroke="#475569" strokeWidth="1.5" opacity="0.6"/>
          <line x1="100" y1="11" x2="100" y2="19" stroke="#475569" strokeWidth="1.5" opacity="0.6"/>
          <line x1="106" y1="12" x2="106" y2="19" stroke="#475569" strokeWidth="1.5" opacity="0.6"/>
          <line x1="112" y1="14" x2="112" y2="20" stroke="#475569" strokeWidth="1.5" opacity="0.6"/>
        </g>
      )
    case 'headband':
      return (
        <g>
          {/* Sport headband */}
          <path d="M84 20 Q84 14 100 13 Q116 14 116 20" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round"/>
        </g>
      )
    case 'hood':
      return (
        <g>
          {/* Raincoat hood — yellow, drawn behind head */}
          <path d="M78 22 Q80 5 100 4 Q120 5 122 22 Q120 14 100 13 Q80 14 78 22Z" fill="#FCD34D"/>
          <ellipse cx="100" cy="22" rx="26" ry="7" fill="#FBBF24" opacity="0.7"/>
        </g>
      )
    default:
      return null
  }
}

interface AccFaceProps {
  scarf: boolean
  sunglasses: boolean
  goggles: boolean
  gloves: boolean
  armsleeve: boolean
}

/** Drawn AFTER Body so items overlay the face/head */
export function AccFace({ scarf, sunglasses, goggles, gloves, armsleeve }: AccFaceProps) {
  return (
    <g>
      {scarf && (
        /* Red scarf draped at neck */
        <g>
          <path d="M84 52 Q100 62 116 52" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M92 56 L88 70" stroke="#EF4444" strokeWidth="5" strokeLinecap="round"/>
        </g>
      )}
      {goggles && (
        /* Ski goggles */
        <g>
          <rect x="81" y="27" width="38" height="11" rx="5" fill="#F97316" opacity="0.85"/>
          <ellipse cx="100" cy="32" rx="16" ry="5" fill="#FCD34D" opacity="0.5"/>
          <ellipse cx="94" cy="31" rx="5" ry="2.5" fill="white" opacity="0.3"/>
        </g>
      )}
      {sunglasses && !goggles && (
        /* Flat sunglasses */
        <g>
          <rect x="87" y="24" width="11" height="7" rx="3" fill="#1E3A5F" opacity="0.88"/>
          <rect x="101" y="24" width="11" height="7" rx="3" fill="#1E3A5F" opacity="0.88"/>
          <line x1="98" y1="27" x2="101" y2="27" stroke="#1E3A5F" strokeWidth="1.5"/>
        </g>
      )}
      {gloves && (
        /* Dark gloves at arm ends */
        <g>
          <ellipse cx="58" cy="92" rx="9" ry="11" fill="#374151"/>
          <ellipse cx="142" cy="92" rx="9" ry="11" fill="#374151"/>
        </g>
      )}
      {armsleeve && (
        /* UV arm sleeve — right arm */
        <g>
          <rect x="120" y="74" width="20" height="24" rx="4" fill="#D1FAE5" opacity="0.8" stroke="#6EE7B7" strokeWidth="1"/>
        </g>
      )}
    </g>
  )
}

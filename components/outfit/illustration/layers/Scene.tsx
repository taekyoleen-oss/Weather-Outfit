import type { HeroIllustKey } from '@/types/outfit'

export function Scene({ illustKey }: { illustKey: HeroIllustKey }) {
  switch (illustKey) {
    case 'summer-light':
    case 'summer-sport':
      return (
        <g>
          <circle cx="166" cy="26" r="24" fill="#FEF08A" opacity="0.5"/>
          <circle cx="166" cy="26" r="14" fill="#FDE047" opacity="0.4"/>
          <line x1="166" y1="5" x2="166" y2="11" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          <line x1="182" y1="12" x2="178" y2="16" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          <line x1="150" y1="12" x2="154" y2="16" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        </g>
      )
    case 'winter-heavy':
    case 'snow-gear':
      return (
        <g>
          <circle cx="30" cy="30" r="2.5" fill="#BAE6FD"/>
          <circle cx="170" cy="20" r="2" fill="#BAE6FD"/>
          <circle cx="24" cy="65" r="1.8" fill="#BAE6FD"/>
          <circle cx="176" cy="55" r="2.2" fill="#BAE6FD"/>
          <circle cx="165" cy="80" r="1.5" fill="#BAE6FD" opacity="0.6"/>
          <circle cx="35" cy="80" r="1.5" fill="#BAE6FD" opacity="0.6"/>
          <line x1="30" y1="27" x2="30" y2="33" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="27" y1="30" x2="33" y2="30" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="170" y1="17" x2="170" y2="23" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="167" y1="20" x2="173" y2="20" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      )
    case 'rain-gear':
      return (
        <g stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" opacity="0.5">
          <line x1="28" y1="8" x2="24" y2="24"/>
          <line x1="48" y1="3" x2="44" y2="19"/>
          <line x1="170" y1="8" x2="166" y2="24"/>
          <line x1="185" y1="18" x2="181" y2="34"/>
          <line x1="18" y1="38" x2="14" y2="54"/>
          <line x1="182" y1="42" x2="178" y2="58"/>
        </g>
      )
    case 'fall-layered':
      return (
        <g>
          <ellipse cx="160" cy="38" rx="13" ry="7" fill="#F59E0B" transform="rotate(-30 160 38)"/>
          <ellipse cx="170" cy="52" rx="11" ry="6" fill="#EF4444" transform="rotate(20 170 52)"/>
          <ellipse cx="152" cy="55" rx="10" ry="5" fill="#D97706" transform="rotate(-15 152 55)"/>
          <ellipse cx="30" cy="42" rx="9" ry="5" fill="#F59E0B" opacity="0.6" transform="rotate(25 30 42)"/>
          <ellipse cx="24" cy="56" rx="8" ry="4" fill="#EF4444" opacity="0.5" transform="rotate(-20 24 56)"/>
        </g>
      )
    case 'spring-mild':
      return (
        <g>
          <circle cx="164" cy="32" r="6" fill="#FCA5A5"/>
          <circle cx="158" cy="24" r="5" fill="#FCA5A5"/>
          <circle cx="170" cy="24" r="5" fill="#FDBA74"/>
          <circle cx="158" cy="40" r="5" fill="#FDBA74"/>
          <circle cx="170" cy="40" r="5" fill="#FCA5A5"/>
          <circle cx="164" cy="32" r="5" fill="#FBBF24"/>
          <circle cx="35" cy="45" r="4" fill="#86EFAC" opacity="0.5"/>
        </g>
      )
    case 'beach-look':
      return (
        <g>
          <circle cx="166" cy="28" r="26" fill="#FEF08A" opacity="0.5"/>
          <circle cx="166" cy="28" r="16" fill="#FDE047" opacity="0.45"/>
          <path d="M10 228 Q40 218 70 228 Q100 238 130 228 Q160 218 190 228" stroke="#38BDF8" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round"/>
          <path d="M5 235 Q35 225 65 235 Q95 245 125 235 Q155 225 195 235" stroke="#7DD3FC" strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round"/>
        </g>
      )
    case 'ski-look':
      return (
        <g>
          <path d="M0 180 L55 120 L88 148 L130 100 L200 165 L200 220 L0 220Z" fill="#E0F2FE" opacity="0.35"/>
          <circle cx="24" cy="28" r="2" fill="#DBEAFE"/>
          <circle cx="178" cy="22" r="2.5" fill="#DBEAFE"/>
          <circle cx="20" cy="68" r="1.8" fill="#DBEAFE"/>
        </g>
      )
    case 'golf-look':
      return (
        <g>
          <path d="M0 210 Q50 202 100 210 Q150 218 200 210 L200 240 L0 240Z" fill="#86EFAC" opacity="0.3"/>
          <line x1="162" y1="70" x2="162" y2="168" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M162 70 L180 80 L162 90Z" fill="#EF4444"/>
        </g>
      )
    default:
      return null
  }
}

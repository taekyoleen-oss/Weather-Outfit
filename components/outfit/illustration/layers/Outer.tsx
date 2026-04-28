import type { OuterVariant } from '../itemLayerMap'

export function Outer({
  variant,
  sleeveLength = 'short',
}: {
  variant: OuterVariant | null
  sleeveLength?: 'short' | 'long'
}) {
  if (!variant) return null

  switch (variant) {
    case 'windbreaker':
      return (
        <g>
          <path d="M68 52 L60 78 L80 84 L80 122 L120 122 L120 84 L140 78 L132 52 Q116 46 100 51 Q84 46 68 52Z" fill="#7C3AED"/>
          {/* Seam lines */}
          <line x1="80" y1="70" x2="120" y2="70" stroke="#6D28D9" strokeWidth="1.5" opacity="0.5"/>
          <line x1="80" y1="84" x2="120" y2="84" stroke="#6D28D9" strokeWidth="1.5" opacity="0.5"/>
          {/* Front zip */}
          <rect x="98" y="56" width="4" height="62" rx="2" fill="#6D28D9" opacity="0.4"/>
          {/* Sleeve cuffs */}
          <rect x="59" y="74" width="21" height="5" rx="2" fill="#6D28D9" opacity="0.5"/>
          <rect x="120" y="74" width="21" height="5" rx="2" fill="#6D28D9" opacity="0.5"/>
          {/* Collar */}
          <path d="M87 52 Q100 60 113 52" stroke="#6D28D9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </g>
      )
    case 'jacket':
      return (
        <g>
          {/* Light jacket / bomber */}
          <path d="M66 52 L58 80 L79 86 L79 124 L121 124 L121 86 L142 80 L134 52 Q118 46 100 51 Q82 46 66 52Z" fill="#475569"/>
          {sleeveLength === 'long' && (
            <>
              {/* Extend sleeves down (long-sleeve) */}
              <path d="M58 80 L79 86 L79 112 L62 112 Q56 102 58 80Z" fill="#475569"/>
              <path d="M142 80 L121 86 L121 112 L138 112 Q144 102 142 80Z" fill="#475569"/>
              {/* Long cuffs */}
              <rect x="60" y="108" width="20" height="5" rx="2.5" fill="#334155" opacity="0.55"/>
              <rect x="120" y="108" width="20" height="5" rx="2.5" fill="#334155" opacity="0.55"/>
            </>
          )}
          {/* Seam lines */}
          <line x1="79" y1="70" x2="121" y2="70" stroke="#334155" strokeWidth="1.5" opacity="0.4"/>
          <line x1="79" y1="86" x2="121" y2="86" stroke="#334155" strokeWidth="1.5" opacity="0.4"/>
          {/* Chest pockets */}
          <rect x="82" y="70" width="12" height="10" rx="2" fill="#334155" opacity="0.4"/>
          <rect x="106" y="70" width="12" height="10" rx="2" fill="#334155" opacity="0.4"/>
          {/* Front zip */}
          <rect x="98" y="56" width="4" height="64" rx="2" fill="#334155" opacity="0.4"/>
          {/* Sleeve cuffs */}
          {sleeveLength === 'short' && (
            <>
              <rect x="57" y="76" width="21" height="5" rx="2" fill="#334155" opacity="0.5"/>
              <rect x="122" y="76" width="21" height="5" rx="2" fill="#334155" opacity="0.5"/>
            </>
          )}
          {/* Collar */}
          <path d="M86 52 Q100 60 114 52" stroke="#334155" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </g>
      )
    case 'trench':
      return (
        <g>
          {/* Trench coat — camel, extends lower */}
          <path d="M66 54 L58 80 L79 86 L79 130 L121 130 L121 86 L142 80 L134 54 Q118 47 100 53 Q82 47 66 54Z" fill="#D97706"/>
          {/* Lapels */}
          <path d="M100 53 L91 54 L79 66 L79 78 L89 78 L100 66Z" fill="#B45309" opacity="0.6"/>
          <path d="M100 53 L109 54 L121 66 L121 78 L111 78 L100 66Z" fill="#B45309" opacity="0.6"/>
          {/* Belt */}
          <rect x="79" y="103" width="42" height="7" rx="2" fill="#92400E" opacity="0.7"/>
          <rect x="97" y="103" width="6" height="7" rx="1" fill="#78350F"/>
          {/* Buttons */}
          <circle cx="100" cy="82" r="2.5" fill="#B45309"/>
          <circle cx="100" cy="93" r="2.5" fill="#B45309"/>
          {/* Side pockets */}
          <path d="M79 113 L79 128 L91 128" stroke="#B45309" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M121 113 L121 128 L109 128" stroke="#B45309" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          {/* Sleeve cuffs */}
          <rect x="58" y="76" width="21" height="6" rx="3" fill="#B45309" opacity="0.5"/>
          <rect x="121" y="76" width="21" height="6" rx="3" fill="#B45309" opacity="0.5"/>
        </g>
      )
    case 'coat':
      return (
        <g>
          {/* Long overcoat — dark navy */}
          <path d="M64 52 L56 82 L78 88 L78 132 L122 132 L122 88 L144 82 L136 52 Q118 45 100 51 Q82 45 64 52Z" fill="#1E3A5F"/>
          {/* Lapels */}
          <path d="M100 51 L90 54 L79 68 L79 84 L90 84 L100 70Z" fill="#1D4ED8" opacity="0.3"/>
          <path d="M100 51 L110 54 L121 68 L121 84 L110 84 L100 70Z" fill="#1D4ED8" opacity="0.3"/>
          {/* Coat buttons */}
          <circle cx="100" cy="88" r="3" fill="#1D4ED8" opacity="0.7"/>
          <circle cx="100" cy="102" r="3" fill="#1D4ED8" opacity="0.7"/>
          <circle cx="100" cy="116" r="3" fill="#1D4ED8" opacity="0.7"/>
          {/* Pocket flaps */}
          <rect x="80" y="108" width="15" height="6" rx="2" fill="#1D4ED8" opacity="0.3"/>
          <rect x="105" y="108" width="15" height="6" rx="2" fill="#1D4ED8" opacity="0.3"/>
          {/* Sleeve cuffs */}
          <rect x="55" y="78" width="23" height="6" rx="3" fill="#1D4ED8" opacity="0.3"/>
          <rect x="122" y="78" width="23" height="6" rx="3" fill="#1D4ED8" opacity="0.3"/>
        </g>
      )
    case 'padding':
      return (
        <g>
          {/* Puffer/padding jacket — navy */}
          <path d="M66 52 L58 82 L79 88 L79 132 L121 132 L121 88 L142 82 L134 52 Q118 45 100 51 Q82 45 66 52Z" fill="#1E3A5F"/>
          {/* Puffer quilting lines */}
          <line x1="79" y1="64" x2="121" y2="64" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.5"/>
          <line x1="79" y1="76" x2="121" y2="76" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.5"/>
          <line x1="79" y1="88" x2="121" y2="88" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.5"/>
          <line x1="79" y1="100" x2="121" y2="100" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.5"/>
          <line x1="79" y1="112" x2="121" y2="112" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.5"/>
          {/* Sleeve quilting */}
          <line x1="66" y1="68" x2="79" y2="72" stroke="#1D4ED8" strokeWidth="1" opacity="0.4"/>
          <line x1="66" y1="78" x2="79" y2="82" stroke="#1D4ED8" strokeWidth="1" opacity="0.4"/>
          <line x1="121" y1="68" x2="134" y2="64" stroke="#1D4ED8" strokeWidth="1" opacity="0.4"/>
          <line x1="121" y1="78" x2="134" y2="74" stroke="#1D4ED8" strokeWidth="1" opacity="0.4"/>
          {/* Center zip */}
          <rect x="98" y="56" width="4" height="72" rx="2" fill="#1D4ED8" opacity="0.4"/>
          <rect x="97" y="70" width="6" height="4" rx="1" fill="#60A5FA"/>
          {/* Collar */}
          <path d="M87 52 Q100 60 113 52" stroke="#1D4ED8" strokeWidth="3" fill="none" strokeLinecap="round"/>
          {/* Gloved hands (built into padded jacket) */}
          <ellipse cx="58" cy="92" rx="10" ry="12" fill="#1E3A5F"/>
          <ellipse cx="142" cy="92" rx="10" ry="12" fill="#1E3A5F"/>
        </g>
      )
    case 'ski-jacket':
      return (
        <g>
          {/* Ski jacket — red */}
          <path d="M66 60 L58 90 L79 96 L79 132 L121 132 L121 96 L142 90 L134 60 Q118 53 100 59 Q82 53 66 60Z" fill="#DC2626"/>
          {/* Shoulder panels */}
          <path d="M66 60 L58 90 L76 94 L76 76Z" fill="#1F2937" opacity="0.5"/>
          <path d="M134 60 L142 90 L124 94 L124 76Z" fill="#1F2937" opacity="0.5"/>
          {/* Seam lines */}
          <line x1="79" y1="80" x2="121" y2="80" stroke="#B91C1C" strokeWidth="2" opacity="0.4"/>
          <line x1="79" y1="96" x2="121" y2="96" stroke="#B91C1C" strokeWidth="2" opacity="0.4"/>
          {/* Chest pockets */}
          <rect x="82" y="68" width="14" height="10" rx="2" fill="#B91C1C" opacity="0.5"/>
          <rect x="104" y="68" width="14" height="10" rx="2" fill="#B91C1C" opacity="0.5"/>
          {/* Front zip */}
          <rect x="98" y="64" width="4" height="64" rx="2" fill="#9F1239" opacity="0.4"/>
          {/* Gloves */}
          <ellipse cx="57" cy="100" rx="12" ry="14" fill="#DC2626"/>
          <ellipse cx="143" cy="100" rx="12" ry="14" fill="#DC2626"/>
          <line x1="48" y1="90" x2="66" y2="90" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round"/>
          <line x1="134" y1="90" x2="152" y2="90" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round"/>
          {/* Neck gaiter stub */}
          <rect x="86" y="54" width="28" height="8" rx="4" fill="#DC2626"/>
        </g>
      )
    case 'raincoat':
      return (
        <g>
          {/* Yellow raincoat */}
          <path d="M72 50 L64 78 L82 84 L82 128 L118 128 L118 84 L136 78 L128 50 Q116 44 100 50 Q84 44 72 50Z" fill="#FCD34D"/>
          {/* Rain jacket seams */}
          <line x1="82" y1="70" x2="118" y2="70" stroke="#F59E0B" strokeWidth="1.5" opacity="0.5"/>
          <line x1="82" y1="86" x2="118" y2="86" stroke="#F59E0B" strokeWidth="1.5" opacity="0.5"/>
          {/* Front zip */}
          <rect x="98" y="55" width="4" height="68" rx="2" fill="#F59E0B" opacity="0.5"/>
          {/* Sleeve cuffs */}
          <rect x="64" y="74" width="18" height="5" rx="2" fill="#F59E0B" opacity="0.5"/>
          <rect x="118" y="74" width="18" height="5" rx="2" fill="#F59E0B" opacity="0.5"/>
          {/* Pockets */}
          <rect x="84" y="108" width="14" height="14" rx="2.5" fill="#F59E0B" opacity="0.4"/>
          <rect x="102" y="108" width="14" height="14" rx="2.5" fill="#F59E0B" opacity="0.4"/>
        </g>
      )
    default:
      return null
  }
}

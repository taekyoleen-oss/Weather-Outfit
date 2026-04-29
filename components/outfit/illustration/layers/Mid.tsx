import type { MidVariant } from '../itemLayerMap'
import { illustSeasonFromMonth, midSeasonFills } from '../illustSeasonPalette'

export function Mid({
  variant,
  calendarMonth,
  sleeveLength = 'short',
}: {
  variant: MidVariant | null
  calendarMonth?: number
  /** `long`: 손목까지 덮는 소매 (후드·스웨터·가디건은 보통 항상 long). `vest`는 소매 없음 */
  sleeveLength?: 'short' | 'long'
}) {
  if (!variant) return null
  const m = midSeasonFills(illustSeasonFromMonth(calendarMonth))
  const long = sleeveLength === 'long'

  switch (variant) {
    case 'cardigan':
      if (long) {
        return (
          <g>
            {/* 바깥선을 반팔 상의 팔 노출(x≈54) 밖으로 넓혀 덮음 */}
            <path d="M64 52 L48 90 L74 96 L74 122 L94 122 L94 68 Q82 57 64 52Z" fill={m.panel} opacity="0.92" />
            <path d="M136 52 L152 90 L126 96 L126 122 L106 122 L106 68 Q120 57 136 52Z" fill={m.panel} opacity="0.92" />
            <rect x="46" y="108" width="24" height="5" rx="2.5" fill={m.cuff} opacity="0.55" />
            <rect x="130" y="108" width="24" height="5" rx="2.5" fill={m.cuff} opacity="0.55" />
            <rect x="46" y="114" width="24" height="3" rx="1" fill={m.detail} opacity="0.4" />
            <rect x="130" y="114" width="24" height="3" rx="1" fill={m.detail} opacity="0.4" />
            <path d="M94 68 L90 52 L100 58Z" fill={m.detail} opacity="0.45" />
            <path d="M106 68 L110 52 L100 58Z" fill={m.detail} opacity="0.45" />
          </g>
        )
      }
      return (
        <g>
          <path d="M64 52 L56 78 L78 84 L78 122 L94 122 L94 62 Q80 56 64 52Z" fill={m.panel} opacity="0.92" />
          <path d="M136 52 L144 78 L122 84 L122 122 L106 122 L106 62 Q120 56 136 52Z" fill={m.panel} opacity="0.92" />
          <rect x="55" y="74" width="21" height="5" rx="2" fill={m.cuff} opacity="0.55" />
          <rect x="124" y="74" width="21" height="5" rx="2" fill={m.cuff} opacity="0.55" />
          <path d="M94 62 L90 52 L100 58Z" fill={m.detail} opacity="0.45" />
          <path d="M106 62 L110 52 L100 58Z" fill={m.detail} opacity="0.45" />
        </g>
      )
    case 'hoodie':
      return (
        <g>
          {long ? (
            <path
              d="M72 52 L52 86 L76 92 L78 122 L122 122 L124 92 L148 86 L128 52 Q114 46 100 51 Q86 46 72 52Z"
              fill={m.panel}
            />
          ) : (
            <path
              d="M66 52 L58 80 L79 86 L79 122 L121 122 L121 86 L142 80 L134 52 Q118 46 100 51 Q82 46 66 52Z"
              fill={m.panel}
            />
          )}
          <path d="M82 50 Q82 36 100 34 Q118 36 118 50 L116 52 Q116 40 100 38 Q84 40 84 52Z" fill={m.cuff} opacity="0.65" />
          <rect x="85" y="104" width="30" height="14" rx="3" fill={m.detail} opacity="0.38" />
          {long ? (
            <>
              <rect x="48" y="108" width="26" height="5" rx="2" fill={m.cuff} opacity="0.5" />
              <rect x="126" y="108" width="26" height="5" rx="2" fill={m.cuff} opacity="0.5" />
              <rect x="48" y="114" width="26" height="3" rx="1" fill={m.detail} opacity="0.35" />
              <rect x="126" y="114" width="26" height="3" rx="1" fill={m.detail} opacity="0.35" />
            </>
          ) : (
            <>
              <rect x="57" y="76" width="21" height="5" rx="2" fill={m.cuff} opacity="0.5" />
              <rect x="122" y="76" width="21" height="5" rx="2" fill={m.cuff} opacity="0.5" />
            </>
          )}
          <path d="M96 52 Q100 56 104 52" stroke={m.detail} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'sweater':
      return (
        <g>
          {long ? (
            <path
              d="M72 52 L52 86 L76 92 L78 122 L122 122 L124 92 L148 86 L128 52 Q114 46 100 51 Q86 46 72 52Z"
              fill={m.panel}
            />
          ) : (
            <path
              d="M68 52 L60 80 L79 86 L79 122 L121 122 L121 86 L140 80 L132 52 Q116 46 100 51 Q84 46 68 52Z"
              fill={m.panel}
            />
          )}
          <line x1="79" y1="66" x2="121" y2="66" stroke={m.detail} strokeWidth="1.5" opacity="0.5" />
          <line x1="79" y1="78" x2="121" y2="78" stroke={m.detail} strokeWidth="1.5" opacity="0.5" />
          <line x1="79" y1="90" x2="121" y2="90" stroke={m.detail} strokeWidth="1.5" opacity="0.5" />
          <line x1="79" y1="102" x2="121" y2="102" stroke={m.detail} strokeWidth="1.5" opacity="0.5" />
          <line x1="79" y1="114" x2="121" y2="114" stroke={m.detail} strokeWidth="1.5" opacity="0.5" />
          {long ? (
            <>
              <rect x="48" y="108" width="26" height="5" rx="2" fill={m.cuff} opacity="0.5" />
              <rect x="126" y="108" width="26" height="5" rx="2" fill={m.cuff} opacity="0.5" />
              <rect x="48" y="114" width="26" height="3" rx="1" fill={m.detail} opacity="0.35" />
              <rect x="126" y="114" width="26" height="3" rx="1" fill={m.detail} opacity="0.35" />
            </>
          ) : (
            <>
              <rect x="59" y="76" width="21" height="6" rx="3" fill={m.cuff} opacity="0.5" />
              <rect x="120" y="76" width="21" height="6" rx="3" fill={m.cuff} opacity="0.5" />
            </>
          )}
          <path d="M88 51 Q100 59 112 51" stroke={m.detail} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'vest':
      return (
        <g>
          <path d="M78 52 L78 122 L122 122 L122 52 Q112 46 100 51 Q88 46 78 52Z" fill={m.panel} opacity="0.88" />
          <rect x="98" y="56" width="4" height="62" rx="2" fill={m.detail} opacity="0.42" />
          <path d="M88 52 Q100 60 112 52" stroke={m.cuff} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )
    default:
      return null
  }
}

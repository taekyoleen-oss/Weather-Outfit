import type { GenderType } from '@/types/outfit'

interface Props {
  gender: GenderType
  hasHelmet?: boolean
}

export function Body({ gender, hasHelmet }: Props) {
  const isF = gender === 'female'

  if (hasHelmet) {
    // Helmeted face: only lower face visible, neck with gaiter
    return (
      <g>
        {/* Neck */}
        <path d="M95 44 L105 44 L104 52 L96 52Z" fill="#FDBA74"/>
        {/* Lower face only (rest covered by helmet) */}
        <path d="M84 38 Q84 54 100 56 Q116 54 116 38Z" fill="#FDBA74"/>
      </g>
    )
  }

  return (
    <g>
      {/* Neck */}
      <path d="M95 44 L105 44 L104 52 L96 52Z" fill="#FDBA74"/>
      {/* Hair */}
      {isF ? (
        /* Female: slightly longer hair sides */
        <path d="M83 26 Q81 6 100 4 Q119 6 117 26 Q120 30 122 38 L118 36 Q112 16 100 15 Q88 16 82 26 L78 38 L84 36 Q80 30 83 26Z" fill="#292524"/>
      ) : (
        /* Male: short hair */
        <path d="M84 24 Q83 7 100 5 Q117 7 116 24 Q110 16 100 15 Q90 16 84 24Z" fill="#1C1917"/>
      )}
      {/* Head */}
      <circle cx="100" cy="28" r="16" fill="#FDBA74"/>
      {/* Face: subtle smile */}
      <path d="M96 32 Q100 36 104 32" stroke="#C2410C" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </g>
  )
}

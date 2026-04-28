interface Props {
  hasUmbrella: boolean
  hasMask: boolean
}

export function RainMask({ hasUmbrella, hasMask }: Props) {
  return (
    <g>
      {hasMask && (
        /* KF94/mask over lower face */
        <g>
          <path d="M88 32 Q100 44 112 32 L112 40 Q100 50 88 40Z" fill="white" stroke="#CBD5E1" strokeWidth="1"/>
          <path d="M90 32 Q100 40 110 32" stroke="#94A3B8" strokeWidth="1" fill="none"/>
          <line x1="88" y1="36" x2="82" y2="34" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="112" y1="36" x2="118" y2="34" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      )}
      {hasUmbrella && (
        /* Teal umbrella held to right side */
        <g>
          <line x1="148" y1="64" x2="148" y2="148" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
          <path d="M124 100 Q148 66 172 92" fill="#5EEAD4" stroke="#0D9488" strokeWidth="1.5"/>
          <path d="M132 93 Q148 74 164 88" fill="#99F6E4" opacity="0.5"/>
          <path d="M148 148 Q150 154 145 157" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </g>
      )}
    </g>
  )
}

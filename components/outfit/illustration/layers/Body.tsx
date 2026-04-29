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
        <path d="M88 38 Q88 54 100 56 Q112 54 112 38Z" fill="#FDBA74"/>
      </g>
    )
  }

  return (
    <g>
      {/* Neck */}
      <path d="M95 44 L105 44 L104 52 L96 52Z" fill="#FDBA74"/>
      {/* Hair */}
      {isF ? (
        /* Female: 하단 너비 = 윗곡선 제어점 폭(82~118, 36px)과 동일 */
        <path d="M83 24 Q82 7 100 5 Q118 7 118 52 Q111 34 100 27 Q89 34 82 52 Q82 7 83 24Z" fill="#292524"/>
      ) : (
        /* Male: 얼굴 타원(rx=11)에 맞춰 좌우 안쪽으로 붙인 단발 */
        <path d="M89 24 Q88 7 100 5 Q112 7 111 24 Q108 16 100 15 Q92 16 89 24Z" fill="#1C1917"/>
      )}
      {/* Head — 세로(ry)·중심은 유지, 가로만 더 좁은 타원 (턱 끝 y=44 동일) */}
      <ellipse cx="100" cy="28" rx="11" ry="16" fill="#FDBA74"/>
      {/* Face: subtle smile */}
      <path d="M98 32 Q100 36 102 32" stroke="#C2410C" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </g>
  )
}

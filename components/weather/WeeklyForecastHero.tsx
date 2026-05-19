'use client'

interface Props {
  /** 헤더 부제에 표시할 위치 이름 (옵션) */
  locationName?: string
}

/**
 * 주간예보 탭 상단의 「위클리 날씨 브리핑」 히어로 카드.
 * 가벼운 글래스 카드 + 이모지 일러스트로 시각 무게중심을 잡고,
 * 그 아래의 8일 리스트(`WeeklyForecastListMobile`)로 자연스럽게 시선이 흐르도록 한다.
 */
export function WeeklyForecastHero({ locationName }: Props) {
  return (
    <div
      className="rounded-2xl px-5 py-5 text-center relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(125,178,228,0.22) 0%, rgba(248,193,134,0.22) 100%)',
        border: '1px solid var(--surface-border)',
      }}
    >
      <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
        WEEKLY BRIEFING
      </p>
      <h2 className="text-lg sm:text-xl font-extrabold leading-tight" style={{ color: 'var(--text)' }}>
        위클리 날씨 브리핑 <span aria-hidden>🌤️☁️</span>
      </h2>
      <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
        {locationName ? `${locationName} ` : ''}이번 주 날씨를 한눈에 보세요
      </p>
    </div>
  )
}

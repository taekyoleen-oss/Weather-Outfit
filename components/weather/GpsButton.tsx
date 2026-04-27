'use client'

interface Props {
  loading: boolean
  error: string | null
  onClick: () => void
}

export function GpsButton({ loading, error, onClick }: Props) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading}
        className="glass-card flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 w-full"
        style={{ borderRadius: '14px', color: loading ? 'var(--muted)' : 'var(--humidity)' }}
        aria-label="내 위치로 설정"
      >
        <span>{loading ? '⟳' : '📍'}</span>
        <span>{loading ? '위치 확인 중...' : '내 위치 날씨'}</span>
      </button>
      {error && (
        <p className="text-xs mt-1.5 px-1" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

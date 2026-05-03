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
        className="flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold transition-opacity active:opacity-90 w-full border bg-transparent"
        style={{
          borderRadius: 'var(--rounded-md)',
          minHeight: 44,
          borderColor: 'var(--colors-hairline-strong)',
          color: loading ? 'var(--muted)' : 'var(--colors-ink)',
        }}
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

interface Props {
  icon: string
  label: string
  value: string
  sub?: string
  accent?: string
  compact?: boolean
  /** 설정 시 외부 페이지(예: 기상특보)로 연결, 새 탭 */
  href?: string
}

export function HighlightCard({ icon, label, value, sub, accent, compact, href }: Props) {
  const shell =
    compact
      ? 'glass-card p-2 sm:p-2.5 flex flex-col gap-0.5 min-h-0'
      : 'glass-card p-3 sm:p-4 flex flex-col gap-2 min-h-[100px]'
  const linkShell = `${shell} no-underline outline-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded-2xl`

  const content = (
    <>
      <div className="flex items-center gap-1">
        <span className={compact ? 'text-sm leading-none' : 'text-xl'}>{icon}</span>
        <span
          className={compact ? 'text-[10px] font-medium leading-tight line-clamp-2' : 'text-xs font-medium'}
          style={{ color: 'var(--muted)' }}
        >
          {label}
        </span>
      </div>
      <div>
        <p
          className={
            compact
              ? 'text-sm font-bold leading-tight line-clamp-2'
              : 'text-xl font-bold leading-tight'
          }
          style={{ color: accent ?? 'var(--primary)' }}
        >
          {value}
        </p>
        {sub && (
          <p
            className={compact ? 'text-[10px] mt-0.5 line-clamp-2' : 'text-xs mt-0.5'}
            style={{ color: 'var(--muted)' }}
          >
            {sub}
          </p>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkShell}
        aria-label={`${label}: ${value}. 기상청 날씨누리에서 상세보기(새 창)`}
      >
        {content}
      </a>
    )
  }

  return (
    <div
      className={shell}
      role="region"
      aria-label={label}
    >
      {content}
    </div>
  )
}

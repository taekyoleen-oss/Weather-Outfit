interface Props {
  icon: string
  label: string
  value: string
  sub?: string
  accent?: string
  compact?: boolean
}

export function HighlightCard({ icon, label, value, sub, accent, compact }: Props) {
  return (
    <div
      className={
        compact
          ? 'glass-card p-2 flex flex-col gap-0.5 min-h-0'
          : 'glass-card p-4 flex flex-col gap-2 min-h-[100px]'
      }
      role="region"
      aria-label={label}
    >
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
    </div>
  )
}

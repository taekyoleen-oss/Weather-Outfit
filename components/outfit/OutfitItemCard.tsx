import type { OutfitItem } from '@/types/outfit'

interface Props {
  item: OutfitItem
}

export function OutfitItemCard({ item }: Props) {
  return (
    <span
      className="inline-flex max-w-full min-w-0 flex-col gap-0.5 rounded-full px-2 py-1 sm:px-2.5 sm:py-1.5"
      style={{
        background: item.required ? 'rgba(239,68,68,0.07)' : 'rgba(100,116,139,0.08)',
        color: item.required ? 'var(--danger)' : 'var(--text)',
        border: `1px solid ${item.required ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
      }}
    >
      <span className="inline-flex min-w-0 flex-wrap items-center gap-1 text-[10px] sm:text-[11px]">
        <span className="flex-shrink-0 text-base leading-none sm:text-lg">{item.icon}</span>
        <span className="font-medium leading-tight">{item.name}</span>
        {item.activityTag && (
          <span
            className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: 'rgba(91,141,238,0.12)',
              color: 'var(--humidity)',
              border: '1px solid rgba(91,141,238,0.25)',
            }}
          >
            {item.activityTag}
          </span>
        )}
        <span
          className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: item.required ? 'rgba(239,68,68,0.12)' : 'rgba(100,116,139,0.12)',
            color: item.required ? 'var(--danger)' : 'var(--muted)',
            border: item.required ? '1px solid rgba(239,68,68,0.22)' : '1px solid var(--border)',
          }}
        >
          {item.required ? '필수' : '선택'}
        </span>
      </span>
      {item.condition && (
        <span className="block pl-0.5 text-[9px] font-normal leading-snug sm:text-[10px]" style={{ color: 'var(--muted)' }}>
          {item.condition}
        </span>
      )}
    </span>
  )
}

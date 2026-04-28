import type { OutfitItem } from '@/types/outfit'

interface Props {
  item: OutfitItem
}

export function OutfitItemCard({ item }: Props) {
  return (
    <div
      className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-lg flex-shrink-0">{item.icon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
          {item.name}
        </p>
        {item.condition && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            {item.condition}
          </p>
        )}
      </div>

      {item.activityTag && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: 'rgba(91,141,238,0.12)', color: 'var(--humidity)', border: '1px solid rgba(91,141,238,0.25)' }}
        >
          {item.activityTag}
        </span>
      )}

      <span
        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: item.required ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
          color: item.required ? 'var(--danger)' : 'var(--muted)',
        }}
      >
        {item.required ? '필수' : '선택'}
      </span>
    </div>
  )
}

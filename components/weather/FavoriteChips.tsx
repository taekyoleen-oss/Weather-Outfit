'use client'

import type { LocationInfo } from '@/types/location'

interface Props {
  favorites: LocationInfo[]
  currentLocation: LocationInfo
  onSelect: (loc: LocationInfo) => void
  onAdd: (loc: LocationInfo) => void
  onRemove: (name: string) => void
}

export function FavoriteChips({ favorites, currentLocation, onSelect, onAdd, onRemove }: Props) {
  const isSaved = favorites.some(f => f.name === currentLocation.name)

  if (favorites.length === 0 && isSaved) return null

  return (
    <div className="flex gap-1.5 overflow-x-auto scroll-strip">
      {/* 현재 위치 저장 버튼 — 아직 저장되지 않은 경우 */}
      {!isSaved && (
        <button
          onClick={() => onAdd(currentLocation)}
          className="flex-shrink-0 rounded-full transition-all active:opacity-70"
          style={{
            fontSize: 11,
            padding: '3px 10px',
            background: 'var(--primary-tint-08)',
            border: '1px dashed var(--colors-primary)',
            color: 'var(--primary)',
            whiteSpace: 'nowrap',
          }}
        >
          ☆ {currentLocation.name} 저장
        </button>
      )}

      {/* 저장된 즐겨찾기 */}
      {favorites.map(f => {
        const active = f.name === currentLocation.name
        return (
          <div
            key={f.name}
            className="flex-shrink-0 flex items-center rounded-full"
            style={{
              background: active ? 'var(--primary-tint-12)' : 'var(--surface)',
              border: `1px solid ${active ? 'var(--colors-primary)' : 'var(--border)'}`,
            }}
          >
            <button
              onClick={() => onSelect(f)}
              style={{
                fontSize: 11,
                padding: '3px 4px 3px 10px',
                color: active ? 'var(--primary)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              ⭐ {f.name}
            </button>
            <button
              onClick={() => onRemove(f.name)}
              aria-label={`${f.name} 즐겨찾기 제거`}
              style={{
                fontSize: 13,
                padding: '3px 8px 3px 2px',
                color: 'var(--muted)',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

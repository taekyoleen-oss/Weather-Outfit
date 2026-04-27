'use client'

import { useEffect, useState } from 'react'
import type { LocationInfo } from '@/types/location'
import type { RecentLocation } from '@/types/location'

const STORAGE_KEY = 'weatherfit:recentLocations'
const MAX_RECENT = 5

export function saveRecentLocation(loc: LocationInfo) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing: RecentLocation[] = raw ? JSON.parse(raw) : []
    const filtered = existing.filter((r) => r.name !== loc.name)
    const updated = [{ ...loc, usedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

interface Props {
  onSelect: (loc: LocationInfo) => void
  currentName: string
}

export function RecentChips({ onSelect, currentName }: Props) {
  const [recents, setRecents] = useState<RecentLocation[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRecents(JSON.parse(raw))
    } catch {}
  }, [])

  if (!recents.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {recents
        .filter((r) => r.name !== currentName)
        .slice(0, 4)
        .map((r) => (
          <button
            key={r.name}
            onClick={() => onSelect(r)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-white/80"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
            }}
          >
            🕐 {r.name}
          </button>
        ))}
    </div>
  )
}

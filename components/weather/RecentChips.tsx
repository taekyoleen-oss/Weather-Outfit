'use client'

import { useEffect, useState } from 'react'
import type { LocationInfo } from '@/types/location'
import type { RecentLocation } from '@/types/location'

const STORAGE_KEY = 'weatherfit:recentLocations'
const MAX_RECENT = 5

function isValidRecentLocation(v: unknown): v is RecentLocation {
  return (
    v != null &&
    typeof v === 'object' &&
    typeof (v as RecentLocation).name === 'string' &&
    typeof (v as RecentLocation).lat === 'number' &&
    typeof (v as RecentLocation).lon === 'number' &&
    typeof (v as RecentLocation).nx === 'number' &&
    typeof (v as RecentLocation).ny === 'number' &&
    typeof (v as RecentLocation).usedAt === 'number'
  )
}

function loadRecentLocations(): RecentLocation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) { localStorage.removeItem(STORAGE_KEY); return [] }
    const valid = parsed.filter(isValidRecentLocation)
    if (valid.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
    return valid
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

export function saveRecentLocation(loc: LocationInfo) {
  if (typeof window === 'undefined') return
  try {
    const existing = loadRecentLocations()
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
    setRecents(loadRecentLocations())
  }, [])

  if (!recents.length) return null

  return (
    <div className="flex gap-1.5 overflow-x-auto scroll-strip">
      {recents
        .filter((r) => r.name !== currentName)
        .slice(0, 3)
        .map((r) => (
          <button
            key={r.name}
            onClick={() => onSelect(r)}
            className="flex-shrink-0 rounded-full border transition-colors hover:bg-white/80"
            style={{
              fontSize: 11,
              padding: '3px 10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
            }}
          >
            🕐 {r.name}
          </button>
        ))}
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import type { LocationInfo } from '@/types/location'
import { getNearbyKoreaCities } from '@/lib/location/koreaCities'

interface Props {
  currentLat: number
  currentLon: number
  currentName: string
  onSelect: (loc: LocationInfo) => void
}

export function NearbyWeatherChips({ currentLat, currentLon, currentName, onSelect }: Props) {
  const nearby = useMemo(
    () => getNearbyKoreaCities(currentLat, currentLon, 5).filter((c) => c.name !== currentName),
    [currentLat, currentLon, currentName]
  )

  if (!nearby.length) return null

  return (
    <div>
      <p className="text-[11px] font-semibold mb-1.5 px-0.5" style={{ color: 'var(--muted)' }}>
        📡 주변 날씨 지역
      </p>
      <div className="flex flex-wrap gap-1.5">
        {nearby.map((city) => (
          <button
            key={city.name}
            onClick={() => onSelect(city)}
            className="text-xs px-2.5 py-1.5 rounded-full border transition-all hover:bg-white/80 active:scale-95"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  )
}

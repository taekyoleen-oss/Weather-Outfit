'use client'

import { useState, useEffect, useRef } from 'react'
import type { LocationInfo } from '@/types/location'

interface Props {
  onSelect: (loc: LocationInfo) => void
}

export function LocationSearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationInfo[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchUnavailable, setSearchUnavailable] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check on mount whether search is available
  useEffect(() => {
    fetch('/api/location/search?q=')
      .then((r) => r.json())
      .then((d) => { if (d?.unavailable) setSearchUnavailable(true) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (searchUnavailable) return
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) { setResults([]); setOpen(false); return }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data?.unavailable) { setSearchUnavailable(true); return }
        if (Array.isArray(data)) {
          setResults(data)
          setOpen(true)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, searchUnavailable])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSelect(loc: LocationInfo) {
    onSelect(loc)
    setQuery(loc.name)
    setOpen(false)
    setResults([])
  }

  if (searchUnavailable) {
    return (
      <div
        className="glass-card flex items-center gap-3 px-4 py-3"
        style={{ borderRadius: '16px' }}
      >
        <span>📍</span>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          장소 검색은 다음 버전에서 제공됩니다.
          <br />
          <span style={{ color: 'var(--primary)', fontWeight: 500 }}>GPS 버튼으로 현재 위치를 설정하세요.</span>
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="glass-card flex items-center gap-2 px-4 py-3"
        style={{ borderRadius: '16px' }}
      >
        <span style={{ color: 'var(--muted)' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="장소 검색 (예: 한강공원, 남산)"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text)' }}
          aria-label="장소 검색"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading && (
          <span className="text-xs animate-spin" style={{ color: 'var(--muted)' }}>⟳</span>
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="text-xs"
            style={{ color: 'var(--muted)' }}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 glass-card py-2 z-50"
          style={{ borderRadius: '16px' }}
          role="listbox"
          aria-label="검색 결과"
        >
          {results.length > 0 ? results.map((loc, i) => (
            <button
              key={i}
              onClick={() => handleSelect(loc)}
              className="w-full flex flex-col px-4 py-2.5 text-left hover:bg-white/60 transition-colors"
              role="option"
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {loc.name}
              </span>
              {loc.address && (
                <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {loc.address}
                </span>
              )}
            </button>
          )) : (
            <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>
              결과가 없습니다. 다른 키워드로 검색해보세요.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

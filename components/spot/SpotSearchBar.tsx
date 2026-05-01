'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LocationInfo } from '@/types/location'
import { searchGolfCourses } from '@/lib/location/golfCourses'

interface Props {
  onSelect: (loc: LocationInfo) => void
  /** 화면 폭이 좁은 모바일에서 결과 카드를 밀집 표시할지 여부 */
  compact?: boolean
}

export function SpotSearchBar({ onSelect, compact = false }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationInfo[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const composingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const runSearch = useCallback((q: string) => {
    setActiveIndex(-1)
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    const hits = searchGolfCourses(q, 8)
    setResults(hits)
    setOpen(hits.length > 0)
  }, [])

  useEffect(() => {
    if (composingRef.current) return
    runSearch(query)
  }, [query, runSearch])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSelect(loc: LocationInfo) {
    onSelect(loc)
    setQuery(loc.name)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((p) => (p + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((p) => (p <= 0 ? results.length - 1 : p - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      } else if (results.length === 1) {
        e.preventDefault()
        handleSelect(results[0])
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="glass-card flex items-center gap-2 px-3 py-2.5"
        style={{ borderRadius: 14 }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 16 }} aria-hidden>⛳</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={(e) => {
            composingRef.current = false
            runSearch((e.target as HTMLInputElement).value)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length) setOpen(true) }}
          placeholder="골프장 검색 (예: 나인브릿지, 스카이72)"
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: 'var(--text)' }}
          aria-label="골프장 검색"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-activedescendant={activeIndex >= 0 ? `spot-option-${activeIndex}` : undefined}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              color: 'var(--muted)',
              background: 'var(--border)',
              width: 32,
              height: 32,
              fontSize: 12,
            }}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 glass-card py-1.5 z-40"
          style={{ borderRadius: 14 }}
          role="listbox"
          aria-label="골프장 검색 결과"
        >
          {results.map((loc, i) => (
            <button
              key={`${loc.name}-${i}`}
              id={`spot-option-${i}`}
              onClick={() => handleSelect(loc)}
              className={`w-full flex items-start gap-2.5 ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} text-left hover:bg-white/60 transition-colors`}
              role="option"
              aria-selected={activeIndex === i}
              style={activeIndex === i ? { background: 'rgba(34,197,94,0.12)' } : undefined}
            >
              <span className="mt-0.5 flex-shrink-0" aria-hidden>⛳</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {loc.name}
                </p>
                {loc.address && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                    {loc.address}
                  </p>
                )}
              </div>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(34,197,94,0.10)', color: '#16a34a' }}
              >
                {loc.nx},{loc.ny}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

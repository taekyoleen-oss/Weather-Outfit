'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LocationInfo } from '@/types/location'

interface Props {
  currentLocation: LocationInfo | null
  onSelect: (loc: LocationInfo) => void
  placeholder?: string
}

export function CompactLocationBar({ currentLocation, onSelect, placeholder }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationInfo[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmList, setConfirmList] = useState<LocationInfo[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const composingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeList = open ? results : confirmOpen ? confirmList : []

  const runSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); setOpen(false); setConfirmOpen(false); return }
    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(q)}`, { signal: ac.signal })
        const data = await res.json() as unknown
        if (Array.isArray(data)) {
          const list = data as LocationInfo[]
          setResults(list)
          setActiveIndex(-1)
          if (list.length === 0) { setOpen(false); setConfirmOpen(false) }
          else if (list.length <= 5) { setConfirmList(list); setConfirmOpen(true); setOpen(false) }
          else { setOpen(true); setConfirmOpen(false) }
        }
      } catch { /* ignore AbortError */ }
      finally { if (!ac.signal.aborted) setLoading(false) }
    }, 350)
  }, [])

  useEffect(() => {
    if (!composingRef.current) runSearch(query)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, runSearch])

  useEffect(() => () => { abortRef.current?.abort() }, [])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setConfirmOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function handleSelect(loc: LocationInfo) {
    onSelect(loc)
    setQuery('')
    setOpen(false)
    setConfirmOpen(false)
    setResults([])
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); setConfirmOpen(false); return }
    const len = activeList.length
    if (!len) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(p => (p + 1) % len) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(p => (p <= 0 ? len - 1 : p - 1)) }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(activeList[activeIndex]) }
  }

  const inputPlaceholder = currentLocation?.name ?? placeholder ?? '지역 검색'

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2 min-h-[48px]"
        style={{
          background: 'var(--glass)',
          border: '1px solid var(--colors-ash-light)',
          borderRadius: 'var(--rounded-md)',
        }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={e => { composingRef.current = false; runSearch((e.target as HTMLInputElement).value) }}
          onKeyDown={handleKeyDown}
          placeholder={inputPlaceholder}
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: 'var(--text)' }}
          aria-label="장소 검색"
        />
        {loading && <span className="text-sm animate-spin flex-shrink-0" style={{ color: 'var(--muted)' }}>⟳</span>}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setOpen(false); setConfirmOpen(false) }}
            className="text-xs rounded-full flex items-center justify-center flex-shrink-0"
            style={{ color: 'var(--muted)', width: 20, height: 20, background: 'var(--border)' }}
            aria-label="지우기"
          >✕</button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-card py-1 z-50" role="listbox">
          {results.slice(0, 8).map((loc, i) => (
            <button
              key={i}
              onClick={() => handleSelect(loc)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
              style={activeIndex === i ? { background: 'var(--primary-tint-12)' } : undefined}
              role="option"
              aria-selected={activeIndex === i}
            >
              <span className="text-sm flex-shrink-0">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{loc.name}</p>
                {loc.address && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{loc.address}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {confirmOpen && confirmList.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 glass-card"
          role="listbox"
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>지역을 선택하세요</span>
          </div>
          <div className="p-1.5 space-y-1">
            {confirmList.map((loc, i) => (
              <button
                key={i}
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all active:opacity-95"
                style={{
                  background: activeIndex === i ? 'var(--primary-tint-10)' : 'transparent',
                  border: '1px solid var(--border)',
                }}
                role="option"
                aria-selected={activeIndex === i}
              >
                <span className="text-base flex-shrink-0">📍</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{loc.name}</p>
                  {loc.address && <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>{loc.address}</p>}
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--humidity)' }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

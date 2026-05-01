'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LocationInfo } from '@/types/location'
import { searchGolfCourses } from '@/lib/location/golfCourses'

interface Props {
  onSelect: (loc: LocationInfo) => void
}

type SearchMode = 'place' | 'address'

export function LocationSearchBar({ onSelect }: Props) {
  const [mode, setMode] = useState<SearchMode>('place')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationInfo[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const [confirmList, setConfirmList] = useState<LocationInfo[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const composingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeList: LocationInfo[] = open ? results : confirmOpen ? confirmList : []

  const runSearch = useCallback(
    (q: string, m: SearchMode) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setError(null)
      setConfirmOpen(false)
      setConfirmList([])
      setActiveIndex(-1)

      if (!q.trim()) {
        setResults([])
        setOpen(false)
        return
      }

      timerRef.current = setTimeout(async () => {
        abortRef.current?.abort()
        const ac = new AbortController()
        abortRef.current = ac

        setLoading(true)
        try {
          const res = await fetch(`/api/location/search?q=${encodeURIComponent(q)}`, { signal: ac.signal })
          const data = await res.json()
          if (data?.error) {
            setError(data.error)
            setResults([])
            setOpen(false)
            return
          }
          if (Array.isArray(data)) {
            const apiResults = data as LocationInfo[]
            const golfMerged =
              m === 'place'
                ? [...searchGolfCourses(q, 5), ...apiResults]
                : apiResults

            const deduped: LocationInfo[] = []
            const seen = new Set<string>()
            for (const loc of golfMerged) {
              const key = `${loc.name}|${loc.nx},${loc.ny}`
              if (seen.has(key)) continue
              seen.add(key)
              deduped.push(loc)
            }

            setResults(deduped)
            setActiveIndex(-1)
            if (deduped.length === 0) {
              setError('검색 결과가 없습니다. 다른 키워드를 입력해 보세요.')
              setOpen(false)
            } else if (deduped.length <= 5) {
              setConfirmList(deduped)
              setConfirmOpen(true)
              setOpen(false)
            } else {
              setOpen(true)
              setConfirmOpen(false)
            }
          }
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
          setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
          setResults([])
          setOpen(false)
        } finally {
          if (!ac.signal.aborted) setLoading(false)
        }
      }, 350)
    },
    []
  )

  useEffect(() => {
    if (composingRef.current) return
    runSearch(query, mode)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, mode, runSearch])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmOpen(false)
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
    setConfirmOpen(false)
    setConfirmList([])
    setResults([])
    setError(null)
    setActiveIndex(-1)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    setConfirmOpen(false)
    setConfirmList([])
    setError(null)
    setActiveIndex(-1)
    abortRef.current?.abort()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      setConfirmOpen(false)
      setActiveIndex(-1)
      return
    }
    const listLen = activeList.length
    if (!listLen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % listLen)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? listLen - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < listLen) {
        e.preventDefault()
        handleSelect(activeList[activeIndex])
      }
    }
  }

  const placeholder =
    mode === 'place'
      ? '장소명 검색 (예: 한강공원, 남산, 스카이72)'
      : '주소 검색 (예: 강남구, 분당구 정자동)'

  const terrainIcon = (loc: LocationInfo) =>
    loc.terrain === 'mountain' ? '⛰️' :
    loc.terrain === 'coastal' ? '🏖️' :
    loc.terrain === 'river' ? '🌊' :
    loc.terrain === 'golf' ? '⛳' : '📍'

  return (
    <div ref={containerRef} className="relative">
      {/* Mode tabs */}
      <div className="flex gap-1 mb-1.5">
        {(
          [
            { key: 'place',   label: '📍 장소명' },
            { key: 'address', label: '🗺 주소' },
          ] as const
        ).map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setQuery(''); setError(null); setResults([]); setConfirmOpen(false); setActiveIndex(-1) }}
            className="text-xs px-2.5 py-1 rounded-full transition-all"
            style={{
              background:
                mode === m.key
                  ? 'var(--humidity)'
                  : 'rgba(91,141,238,0.1)',
              color:
                mode === m.key
                  ? 'white'
                  : 'var(--humidity)',
              fontWeight: mode === m.key ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="glass-card flex items-center gap-2 px-3 py-2.5"
        style={{ borderRadius: '14px' }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 16 }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={(e) => {
            composingRef.current = false
            runSearch((e.target as HTMLInputElement).value, mode)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: 'var(--text)' }}
          aria-label="장소 검색"
          aria-autocomplete="list"
          aria-expanded={open || confirmOpen}
          aria-activedescendant={activeIndex >= 0 ? `loc-option-${activeIndex}` : undefined}
          autoComplete="off"
        />
        {loading && (
          <span className="text-base animate-spin flex-shrink-0" style={{ color: 'var(--muted)' }}>⟳</span>
        )}
        {query && !loading && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              color: 'var(--muted)',
              background: 'var(--border)',
              width: 44,
              height: 44,
              margin: '-10px -6px -10px 0',
              fontSize: 12,
            }}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error message */}
      {error && !open && !confirmOpen && (
        <p className="text-xs mt-1.5 px-1" style={{ color: 'var(--danger)' }}>
          ⚠️ {error}
        </p>
      )}

      {/* ── Compact dropdown (>5 results) ── */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 glass-card py-1.5 z-50"
          style={{ borderRadius: '14px' }}
          role="listbox"
          aria-label="검색 결과"
        >
          {results.map((loc, i) => (
            <button
              key={i}
              id={`loc-option-${i}`}
              onClick={() => handleSelect(loc)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/60 transition-colors"
              role="option"
              aria-selected={activeIndex === i}
              style={activeIndex === i ? { background: 'rgba(91,141,238,0.12)' } : undefined}
            >
              <span className="mt-0.5 flex-shrink-0 text-sm">{terrainIcon(loc)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {loc.name}
                  </p>
                  {loc.terrain === 'golf' && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}
                    >
                      골프장
                    </span>
                  )}
                </div>
                {loc.address && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                    {loc.address}
                  </p>
                )}
              </div>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--humidity)' }}
              >
                {loc.nx},{loc.ny}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Address confirmation popup (≤5 results, non-golf) ── */}
      {confirmOpen && confirmList.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 z-50"
          style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
          role="listbox"
          aria-label="주소 확인"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3.5 py-2.5 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              📍 주소를 확인하고 선택하세요 ({confirmList.length}개)
            </span>
            <button
              onClick={() => { setConfirmOpen(false); setActiveIndex(-1) }}
              className="flex items-center justify-center rounded-full"
              style={{ color: 'var(--muted)', background: 'var(--border)', width: 44, height: 44 }}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* Address cards */}
          <div className="p-2 space-y-1.5">
            {confirmList.map((loc, i) => (
              <button
                key={i}
                id={`loc-option-${i}`}
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: activeIndex === i ? 'rgba(91,141,238,0.1)' : 'rgba(255,255,255,0.6)',
                  border: '1px solid var(--border)',
                }}
                role="option"
                aria-selected={activeIndex === i}
              >
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(91,141,238,0.08)' }}
                >
                  {terrainIcon(loc)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {loc.name}
                  </p>
                  {loc.address ? (
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>
                      {loc.address}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      주소 정보 없음
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--humidity)' }}
                  >
                    {loc.nx},{loc.ny}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--humidity)' }}>
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

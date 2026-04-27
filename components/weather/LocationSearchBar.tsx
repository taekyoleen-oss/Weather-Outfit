'use client'

import { useState, useEffect, useRef } from 'react'
import type { LocationInfo } from '@/types/location'
import { searchGolfCourses } from '@/lib/location/golfCourses'

interface Props {
  onSelect: (loc: LocationInfo) => void
}

type SearchMode = 'place' | 'address' | 'golf'

export function LocationSearchBar({ onSelect }: Props) {
  const [mode, setMode] = useState<SearchMode>('place')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationInfo[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Address confirmation state: active when results ≤ 5 (non-golf)
  const [confirmList, setConfirmList] = useState<LocationInfo[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setError(null)
    setConfirmOpen(false)
    setConfirmList([])

    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    // ── 골프장 탭: 로컬 즉시 검색 ──────────────────────────────
    if (mode === 'golf') {
      const hits = searchGolfCourses(query, 6)
      setResults(hits)
      setOpen(hits.length > 0)
      if (hits.length === 0) setError('검색된 골프장이 없습니다. 골프장 이름을 입력해 보세요.')
      return
    }

    // ── 장소명·주소 탭: API 검색 ─────────────────────────────
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data?.error) {
          setError(data.error)
          setResults([])
          setOpen(false)
          return
        }
        if (Array.isArray(data)) {
          setResults(data)
          if (data.length === 0) {
            setError('검색 결과가 없습니다. 다른 키워드를 입력해 보세요.')
            setOpen(false)
          } else if (data.length <= 5) {
            // ≤5 results → address confirmation mode
            setConfirmList(data)
            setConfirmOpen(true)
            setOpen(false)
          } else {
            // >5 results → compact dropdown
            setOpen(true)
            setConfirmOpen(false)
          }
        }
      } catch {
        setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, mode])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmOpen(false)
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
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    setConfirmOpen(false)
    setConfirmList([])
    setError(null)
  }

  const placeholder =
    mode === 'place'
      ? '장소명 검색 (예: 한강공원, 남산)'
      : mode === 'address'
      ? '주소 검색 (예: 강남구, 분당구 정자동)'
      : '골프장 검색 (예: 나인브릿지, 레이크사이드)'

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
            { key: 'golf',    label: '⛳ 골프장' },
          ] as const
        ).map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setQuery(''); setError(null); setResults([]); setConfirmOpen(false) }}
            className="text-xs px-2.5 py-1 rounded-full transition-all"
            style={{
              background:
                mode === m.key
                  ? m.key === 'golf' ? '#16a34a' : 'var(--humidity)'
                  : m.key === 'golf' ? 'rgba(34,197,94,0.1)' : 'rgba(91,141,238,0.1)',
              color:
                mode === m.key
                  ? 'white'
                  : m.key === 'golf' ? '#16a34a' : 'var(--humidity)',
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
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: 'var(--text)' }}
          aria-label="장소 검색"
          aria-autocomplete="list"
          aria-expanded={open || confirmOpen}
          autoComplete="off"
        />
        {loading && (
          <span className="text-base animate-spin flex-shrink-0" style={{ color: 'var(--muted)' }}>⟳</span>
        )}
        {query && !loading && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 text-sm w-5 h-5 flex items-center justify-center rounded-full"
            style={{ color: 'var(--muted)', background: 'var(--border)' }}
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

      {/* ── Compact dropdown (>5 results or golf) ── */}
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
              onClick={() => handleSelect(loc)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/60 transition-colors"
              role="option"
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
              onClick={() => setConfirmOpen(false)}
              className="text-xs w-5 h-5 flex items-center justify-center rounded-full"
              style={{ color: 'var(--muted)', background: 'var(--border)' }}
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
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid var(--border)',
                }}
                role="option"
              >
                {/* Icon */}
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(91,141,238,0.08)' }}
                >
                  {terrainIcon(loc)}
                </span>

                {/* Name + address */}
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

                {/* Grid badge + arrow */}
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

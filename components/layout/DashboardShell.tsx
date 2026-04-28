'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const ZOOM_STORAGE_KEY = 'wf:desktopZoom'
const ZOOM_MIN = 0.65
const ZOOM_MAX = 1.35
const ZOOM_STEP = 0.05
// PC 기본 가독성 스케일 (사용자 줌과 별개로 기본값 상향)
const DESKTOP_BASE_SCALE = 1.16

interface Props {
  left: ReactNode
  right: ReactNode
}

function loadStoredZoom(): number {
  if (typeof window === 'undefined') return 1
  try {
    const raw = localStorage.getItem(ZOOM_STORAGE_KEY)
    if (!raw) return 1
    const n = JSON.parse(raw) as number
    if (typeof n !== 'number' || Number.isNaN(n)) return 1
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n))
  } catch {
    return 1
  }
}

const supportsCssZoom =
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('zoom', '1')

export function DashboardShell({ left, right }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const baseFitRef = useRef(1)
  const userZoomRef = useRef(1)
  const [userZoom, setUserZoom] = useState(1)
  const [fitPct, setFitPct] = useState(100)
  const [appliedPct, setAppliedPct] = useState(100)

  useEffect(() => {
    const z = loadStoredZoom()
    userZoomRef.current = z
    setUserZoom(z)
  }, [])

  userZoomRef.current = userZoom

  const applyCombinedZoom = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    if (!supportsCssZoom) return
    const combined = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, baseFitRef.current * userZoomRef.current * DESKTOP_BASE_SCALE)
    )
    el.style.zoom = String(combined)
    setAppliedPct(Math.round(combined * 100))
  }, [])

  const measureViewportFitOnly = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    if (!supportsCssZoom) {
      baseFitRef.current = 1
      setFitPct(100)
      return
    }
    el.style.zoom = '1'
    const sw = el.scrollWidth
    const cw = el.clientWidth
    baseFitRef.current = sw > cw + 2 ? cw / sw : 1
    setFitPct(Math.round(baseFitRef.current * 100))
    applyCombinedZoom()
  }, [applyCombinedZoom])

  useLayoutEffect(() => {
    measureViewportFitOnly()
  }, [measureViewportFitOnly, left, right])

  useLayoutEffect(() => {
    applyCombinedZoom()
  }, [userZoom, applyCombinedZoom])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => measureViewportFitOnly())
    ro.observe(el)
    window.addEventListener('resize', measureViewportFitOnly)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measureViewportFitOnly)
    }
  }, [measureViewportFitOnly])

  function nudge(delta: number) {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, userZoomRef.current + delta))
    userZoomRef.current = next
    setUserZoom(next)
    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  function resetZoom() {
    userZoomRef.current = 1
    setUserZoom(1)
    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, JSON.stringify(1))
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="hidden lg:block min-h-screen w-full min-w-0 max-w-full overflow-x-hidden box-border"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="sticky top-0 z-50 flex flex-wrap items-center justify-end gap-2 px-1 py-2 border-b"
        style={{
          background: 'var(--background)',
          borderColor: 'var(--border)',
        }}
      >
        <span className="text-xs font-medium mr-auto pl-1" style={{ color: 'var(--muted)' }}>
          {supportsCssZoom ? (
            <>
              너비 맞춤 {fitPct}% · 표시 {appliedPct}%
            </>
          ) : (
            <>표시 확대/축소는 Chrome·Edge·Safari에서 동작합니다.</>
          )}
        </span>
        <button
          type="button"
          onClick={() => nudge(-ZOOM_STEP)}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-white/80"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          aria-label="축소"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-white/80"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          aria-label="사용자 확대 기본값"
        >
          기본
        </button>
        <button
          type="button"
          onClick={() => nudge(ZOOM_STEP)}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-white/80"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          aria-label="확대"
        >
          +
        </button>
      </div>

      <div className="w-full min-w-0 max-w-full px-0 box-border py-2">
        <div
          ref={rootRef}
          className="w-full min-w-0 max-w-full grid gap-5 lg:gap-6 [grid-template-columns:minmax(0,clamp(270px,32vw,460px))_minmax(0,1fr)]"
        >
          <aside className="min-w-0 lg:sticky lg:top-14 lg:self-start space-y-4">{left}</aside>
          <main className="min-w-0 w-full max-w-full space-y-4 overflow-x-hidden">{right}</main>
        </div>
      </div>
    </div>
  )
}

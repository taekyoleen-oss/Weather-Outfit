'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const ZOOM_STORAGE_KEY = 'wf:desktopZoom'
const ZOOM_MIN = 0.65
const ZOOM_MAX = 1.35
const ZOOM_STEP = 0.05
// PC 기본 가독성 스케일 (사용자 줌과 별개로 기본값 상향)
const DESKTOP_BASE_SCALE = 1.16

interface Props {
  /** 전체 폭 상단(줌 바 아래, 2열 그리드 위) — PC 통합 검색·접이식 블록 등 */
  top?: ReactNode
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

function detectCssZoomSupport(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('zoom', '1')
}

export function DashboardShell({ top, left, right }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const baseFitRef = useRef(1)
  const userZoomRef = useRef(1)
  const rafRef = useRef<number | null>(null)
  const [userZoom, setUserZoom] = useState(1)
  const [fitPct, setFitPct] = useState(100)
  const [appliedPct, setAppliedPct] = useState(100)
  /** SSR·첫 페인트는 false로 서버 HTML과 맞추고, 마운트 후 브라우저에서만 true 가능 */
  const [supportsCssZoom, setSupportsCssZoom] = useState(false)

  useEffect(() => {
    setSupportsCssZoom(detectCssZoomSupport())
  }, [])

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
  }, [supportsCssZoom])

  const measureViewportFitOnly = useCallback(() => {
    // rAF으로 쓰로틀: 같은 프레임 내 중복 측정 방지 및 강제 리플로우 최소화
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const el = rootRef.current
      if (!el) return
      if (!supportsCssZoom) {
        baseFitRef.current = 1
        setFitPct(100)
        return
      }
      // zoom='1' 쓰기 → 다음 rAF에서 측정 (같은 프레임 내 읽기/쓰기 분리)
      el.style.zoom = '1'
      requestAnimationFrame(() => {
        const sw = el.scrollWidth
        const cw = el.clientWidth
        baseFitRef.current = sw > cw + 2 ? cw / sw : 1
        setFitPct(Math.round(baseFitRef.current * 100))
        applyCombinedZoom()
      })
    })
  }, [supportsCssZoom, applyCombinedZoom])

  // left/right 제거: ResizeObserver가 콘텐츠 크기 변화를 감지하므로 불필요한 재측정 방지
  useLayoutEffect(() => {
    measureViewportFitOnly()
  }, [measureViewportFitOnly])

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
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
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
      style={{ background: 'var(--colors-cream-soft)' }}
    >
      <div
        className="sticky top-0 z-50 flex flex-wrap items-center justify-end gap-2 px-3 py-2.5 border-b"
        style={{
          background: 'var(--colors-canvas)',
          borderColor: 'var(--colors-hairline-soft)',
          boxShadow: 'rgba(0, 0, 0, 0.03) 0px 1px 2px 0px',
        }}
      >
        <span className="text-xs font-medium mr-auto pl-1" style={{ color: 'var(--colors-slate)' }}>
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
          className="text-xs font-medium px-3 py-2 transition-opacity active:opacity-80"
          style={{
            color: 'var(--colors-ink)',
            border: '1px solid var(--colors-hairline-strong)',
            borderRadius: '8px',
            minHeight: 40,
          }}
          aria-label="축소"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="text-xs font-medium px-3 py-2 transition-opacity active:opacity-80"
          style={{
            color: 'var(--colors-ink)',
            border: '1px solid var(--colors-hairline-strong)',
            borderRadius: '8px',
            minHeight: 40,
          }}
          aria-label="사용자 확대 기본값"
        >
          기본
        </button>
        <button
          type="button"
          onClick={() => nudge(ZOOM_STEP)}
          className="text-xs font-medium px-3 py-2 transition-opacity active:opacity-80"
          style={{
            color: 'var(--colors-ink)',
            border: '1px solid var(--colors-hairline-strong)',
            borderRadius: '8px',
            minHeight: 40,
          }}
          aria-label="확대"
        >
          +
        </button>
      </div>

      <div className="w-full min-w-0 max-w-full px-0 box-border py-6">
        {top ? (
          <div
            className="w-full min-w-0 max-w-full px-4 sm:px-6 lg:px-8 pb-10 mb-0 box-border max-w-[1280px] mx-auto"
            style={{ borderBottom: '1px solid var(--colors-hairline-light)' }}
          >
            {top}
          </div>
        ) : null}
        <div
          ref={rootRef}
          className="w-full min-w-0 max-w-full px-4 sm:px-6 lg:px-8 pt-10 grid gap-8 lg:gap-10 [grid-template-columns:minmax(0,clamp(270px,32vw,460px))_minmax(0,1fr)] max-w-[1280px] mx-auto"
        >
          <aside className="min-w-0 lg:sticky lg:top-14 lg:self-start space-y-6">{left}</aside>
          <main className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">{right}</main>
        </div>
      </div>
    </div>
  )
}

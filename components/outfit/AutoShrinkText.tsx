'use client'
import { useRef, useLayoutEffect } from 'react'

export function AutoShrinkText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.fontSize = ''
    const s0 = parseFloat(getComputedStyle(el).fontSize)
    const lh0 = getComputedStyle(el).lineHeight
    const h0 = lh0 === 'normal' ? s0 * 1.3 : parseFloat(lh0)
    if (el.scrollHeight <= h0 * 1.5) return
    for (const px of [6, 5.5, 5]) {
      el.style.fontSize = `${px}px`
      const lh = getComputedStyle(el).lineHeight
      const h = lh === 'normal' ? px * 1.3 : parseFloat(lh)
      if (el.scrollHeight <= h * 1.5) break
    }
  }, [text])

  return <span ref={ref} className={className}>{text}</span>
}

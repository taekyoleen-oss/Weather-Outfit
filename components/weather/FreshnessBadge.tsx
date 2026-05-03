'use client'

import { useEffect, useState } from 'react'

interface Props {
  fetchedAt: number | undefined
}

export function FreshnessBadge({ fetchedAt }: Props) {
  const [label, setLabel] = useState<string>('')
  const [stale, setStale] = useState(false)

  useEffect(() => {
    if (!fetchedAt) return

    const update = () => {
      const diffMin = Math.floor((Date.now() - fetchedAt) / 60000)
      const d = new Date(fetchedAt)
      const hhmm = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      setLabel(`마지막 갱신 ${hhmm}`)
      setStale(diffMin > 35)
    }

    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [fetchedAt])

  if (!label) return null

  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{
        background: stale ? 'rgba(200, 27, 58, 0.12)' : 'var(--primary-tint-10)',
        color: stale ? 'var(--colors-warning)' : 'var(--colors-primary)',
      }}
    >
      <span>{stale ? '🔴' : '🟡'}</span>
      {label}
    </span>
  )
}

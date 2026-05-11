'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error) {
    console.error('[ChartErrorBoundary]', error)
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="glass-card p-3 sm:p-4">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>차트를 불러올 수 없습니다.</p>
        </div>
      )
    }
    return this.props.children
  }
}

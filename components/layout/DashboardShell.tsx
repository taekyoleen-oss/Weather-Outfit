import type { ReactNode } from 'react'

interface Props {
  left: ReactNode
  right: ReactNode
}

export function DashboardShell({ left, right }: Props) {
  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-[1280px] grid gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start space-y-4">
          {left}
        </aside>
        <main className="space-y-6">
          {right}
        </main>
      </div>
    </div>
  )
}

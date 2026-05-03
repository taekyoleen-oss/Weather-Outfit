export function Footer() {
  return (
    <>
      <div className="wf-sunset-stripe" aria-hidden />
      <footer
        className="mt-0 py-12 px-6 text-center"
        style={{
          background: 'var(--colors-footer-cream)',
          color: 'var(--colors-ink)',
          borderTop: '1px solid var(--colors-beige-deep)',
        }}
      >
        <p className="text-sm mb-2" style={{ color: 'var(--colors-slate)' }}>
          더 많은 앱을 활용하거나 만들고 싶으면
        </p>
        <a
          href="https://www.vibecodinglab.ai.kr/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity active:opacity-80"
          style={{ color: 'var(--colors-primary)' }}
        >
          바이브코딩랩 방문하기 →
        </a>
        <p className="text-xs mt-3" style={{ color: 'var(--colors-steel)' }}>
          vibecodinglab.ai.kr
        </p>
      </footer>
    </>
  )
}

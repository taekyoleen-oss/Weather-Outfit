interface Props {
  /** Base size in px — controls proportional emoji sizing and container dimensions */
  size: number
  className?: string
}

export function NightCloudyIcon({ size, className }: Props) {
  return (
    <span
      className={`relative inline-block leading-none${className ? ` ${className}` : ''}`}
      style={{
        width: Math.round(size * 0.42),
        height: Math.round(size * 0.38),
        color: '#94A3B8',
        filter: 'grayscale(1) saturate(0)',
        fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
      }}
      aria-hidden="true"
    >
      <span
        className="absolute leading-none"
        style={{ left: Math.round(size * 0.03), top: Math.round(size * -0.12), fontSize: Math.round(size * 0.34) }}
      >
        🌙
      </span>
      <span
        className="absolute leading-none"
        style={{ left: Math.round(size * 0.17), top: Math.round(size * 0.03), fontSize: Math.round(size * 0.26) }}
      >
        ☁️
      </span>
    </span>
  )
}

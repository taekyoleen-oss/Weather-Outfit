/**
 * 복장 SVG 상단 하늘용 라인 날씨 아이콘.
 * 스타일: 굵은 스트로크·라운드 캡·차콜 구름 + 레드/오렌지 포인트(첨부 라인 아이콘 참고).
 */
import type { PtyCode, SkyCode } from '@/types/weather'

/** 첨부 라인 아이콘 스타일 — 굵은 스트로크, 라운드 캡, 외곽선 위주 */
const G = '#334155'
const R = '#E11D48'
const O = '#EA580C'
const SW = 2.6

type DecorMode = 'clear' | 'partly' | 'cloudy' | 'rain' | 'snow' | 'mix' | 'thunder'

function resolveMode(sky: SkyCode, pty: PtyCode): DecorMode {
  if (pty === '4') return 'thunder'
  if (pty === '3') return 'snow'
  if (pty === '2') return 'mix'
  if (pty === '1') return 'rain'
  if (sky === '4') return 'cloudy'
  if (sky === '3') return 'partly'
  return 'clear'
}

/** 풍선형 구름 외곽선 (단일 path) */
function CloudPath({ dx = 0, dy = 0 }: { dx?: number; dy?: number }) {
  const t = `translate(${dx},${dy})`
  return (
    <path
      transform={t}
      fill="none"
      stroke={G}
      strokeWidth={SW}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M 18 46 C 6 46 2 36 8 30 C 4 20 18 14 28 20 C 34 10 52 10 60 18 C 74 12 88 22 84 34 C 92 40 88 52 74 52 L 26 52 C 12 54 4 48 18 46 Z"
    />
  )
}

/** 원형 태양 외곽 + 광선 (맑음) */
function ClearSun() {
  const cx = 62
  const cy = 28
  const r0 = 10
  const r1 = 14
  const r2 = 20
  return (
    <g>
      <circle cx={cx} cy={cy} r={r0} fill="none" stroke={O} strokeWidth={SW} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * r1}
            y1={cy + Math.sin(rad) * r1}
            x2={cx + Math.cos(rad) * r2}
            y2={cy + Math.sin(rad) * r2}
            stroke={deg % 90 === 0 ? R : O}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

/** 구름 뒤 반원 태양 + 구름 (구름 많음) */
function PartlySun() {
  return (
    <g>
      <circle cx="78" cy="18" r="9" fill="none" stroke={O} strokeWidth={SW} />
      <line x1="78" y1="1" x2="78" y2="7" stroke={R} strokeWidth={SW} strokeLinecap="round" />
      <line x1="93" y1="8" x2="88" y2="12" stroke={O} strokeWidth={SW} strokeLinecap="round" />
      <line x1="63" y1="8" x2="68" y2="12" stroke={R} strokeWidth={SW} strokeLinecap="round" />
      <CloudPath dx={-6} dy={6} />
    </g>
  )
}

function RainLines() {
  const drops = [
    { x1: 28, y1: 54, x2: 22, y2: 64, c: R },
    { x1: 42, y1: 54, x2: 36, y2: 66, c: O },
    { x1: 56, y1: 54, x2: 50, y2: 64, c: R },
    { x1: 70, y1: 54, x2: 64, y2: 66, c: O },
  ]
  return (
    <g>
      {drops.map((d, i) => (
        <line key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={d.c} strokeWidth={SW} strokeLinecap="round" />
      ))}
    </g>
  )
}

function SnowFlakes() {
  const pts = [
    { x: 30, y: 60, c: R },
    { x: 48, y: 62, c: O },
    { x: 66, y: 60, c: R },
  ]
  return (
    <g>
      {pts.map((p, i) => (
        <path
          key={i}
          transform={`translate(${p.x},${p.y})`}
          fill="none"
          stroke={p.c}
          strokeWidth={SW * 0.85}
          strokeLinecap="round"
          d="M 0 -5 L 0 5 M -4 -3 L 4 3 M -4 3 L 4 -3"
        />
      ))}
    </g>
  )
}

function Lightning() {
  return (
    <path
      fill="none"
      stroke={R}
      strokeWidth={SW}
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M 52 22 L 44 40 L 50 40 L 42 62 L 58 34 L 50 34 L 56 22 Z"
    />
  )
}

interface Props {
  skyCode: SkyCode
  ptyCode: PtyCode
}

/**
 * 복장 SVG 상단 하늘 밴드(-ILLUST_SKY_TOP~0)용 날씨 라인 데코.
 * 첨부 참고: 굵은 스트로크, 라운드, 차콜 구름 + 레드/오렌지 포인트.
 */
export function WeatherSkyDecor({ skyCode, ptyCode }: Props) {
  const mode = resolveMode(skyCode, ptyCode)

  const body = (() => {
    switch (mode) {
      case 'clear':
        return <ClearSun />
      case 'partly':
        return <PartlySun />
      case 'cloudy':
        return <CloudPath />
      case 'rain':
        return (
          <g>
            <CloudPath dy={-4} />
            <RainLines />
          </g>
        )
      case 'snow':
        return (
          <g>
            <CloudPath dy={-4} />
            <SnowFlakes />
          </g>
        )
      case 'mix':
        return (
          <g>
            <CloudPath dy={-4} />
            <RainLines />
            <path
              transform="translate(78,62)"
              fill="none"
              stroke={O}
              strokeWidth={SW * 0.85}
              strokeLinecap="round"
              d="M 0 -4 L 0 4 M -3 -2 L 3 2 M -3 2 L 3 -2"
            />
          </g>
        )
      case 'thunder':
        return (
          <g>
            <CloudPath dy={-6} />
            <Lightning />
            <RainLines />
          </g>
        )
      default:
        return null
    }
  })()

  if (!body) return null

  return (
    <g
      aria-hidden="true"
      transform="translate(98, -52) scale(0.92)"
      style={{ pointerEvents: 'none' }}
    >
      {body}
    </g>
  )
}

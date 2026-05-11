/**
 * 복장 캐릭터 프레임 뒤에 깔리는 반투명 날씨 배경 SVG.
 * - 캐릭터(PNG) 위에 텍스트가 없으므로 칩 가독성과 무관하나,
 *   본체 실루엣을 침해하지 않도록 데코는 상단·외곽으로 집중하고
 *   전체 알파는 낮게 유지(틴트 ≤0.18, 데코 ≤0.55).
 */
import type { PtyCode, SkyCode } from '@/types/weather'

export type WeatherBgMode = 'rain-light' | 'rain-heavy' | 'snow' | 'sunny' | 'windy' | 'none'

/** 우천/강설/맑음/강풍 우선순위로 모드 결정 */
export function resolveWeatherBgMode(params: {
  ptyCode?: PtyCode
  skyCode?: SkyCode
  precipitation?: number
  showSunshine?: boolean
  windAlert?: boolean
}): WeatherBgMode {
  const { ptyCode, precipitation = 0, showSunshine, windAlert } = params
  if (ptyCode === '3' || ptyCode === '2') return 'snow'
  if (ptyCode === '1' || ptyCode === '4') {
    return precipitation >= 3 ? 'rain-heavy' : 'rain-light'
  }
  if (showSunshine) return 'sunny'
  if (windAlert) return 'windy'
  return 'none'
}

interface Props {
  mode: WeatherBgMode
  className?: string
}

/** 200×296 viewBox: 캐릭터 PNG 비율과 동일. slice로 프레임 채움 */
const VB_W = 200
const VB_H = 296

export function WeatherCharBg({ mode, className }: Props) {
  if (mode === 'none') return null

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      focusable={false}
    >
      {mode === 'rain-light' && <RainLightLayer />}
      {mode === 'rain-heavy' && <RainHeavyLayer />}
      {mode === 'snow' && <SnowLayer />}
      {mode === 'sunny' && <SunnyLayer />}
      {mode === 'windy' && <WindyLayer />}
    </svg>
  )
}

function RainLightLayer() {
  const blue = '#5B8DEE'
  return (
    <g>
      <defs>
        <linearGradient id="rainLightTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={blue} stopOpacity="0.16" />
          <stop offset="100%" stopColor={blue} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#rainLightTint)" />
      {/* 옅은 구름 */}
      <path
        d="M 28 30 C 18 30 14 22 22 18 C 20 10 36 6 44 14 C 52 6 70 12 70 22 C 80 22 84 32 74 36 L 32 36 C 22 38 18 32 28 30 Z"
        fill={blue}
        opacity="0.18"
      />
      {/* 빗방울 — 상단 1/3 영역, 비스듬하게 */}
      {RAIN_DROP_LIGHT.map(([x, y, l], i) => (
        <line
          key={i}
          x1={x}
          y1={y}
          x2={x - 4}
          y2={y + l}
          stroke={blue}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />
      ))}
    </g>
  )
}

function RainHeavyLayer() {
  const blue = '#3B6FD8'
  return (
    <g>
      <defs>
        <linearGradient id="rainHeavyTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={blue} stopOpacity="0.22" />
          <stop offset="100%" stopColor={blue} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#rainHeavyTint)" />
      {/* 짙은 구름 두 덩이 */}
      <path
        d="M 18 26 C 8 26 4 18 12 14 C 10 6 26 2 34 10 C 42 2 60 8 60 18 C 70 18 74 28 64 32 L 22 32 C 12 34 8 28 18 26 Z"
        fill={blue}
        opacity="0.26"
      />
      <path
        d="M 118 42 C 110 42 106 34 112 30 C 110 22 124 18 132 24 C 140 18 156 24 156 32 C 166 32 168 42 158 46 L 122 46 C 114 48 110 44 118 42 Z"
        fill={blue}
        opacity="0.20"
      />
      {/* 빗방울 — 더 많고 길게, 상단 절반 */}
      {RAIN_DROP_HEAVY.map(([x, y, l], i) => (
        <line
          key={i}
          x1={x}
          y1={y}
          x2={x - 5}
          y2={y + l}
          stroke={blue}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.55"
        />
      ))}
    </g>
  )
}

function SnowLayer() {
  const slate = '#94A3B8'
  const white = '#FFFFFF'
  return (
    <g>
      <defs>
        <linearGradient id="snowTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={slate} stopOpacity="0.18" />
          <stop offset="100%" stopColor={slate} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#snowTint)" />
      {/* 부드러운 구름 */}
      <path
        d="M 22 28 C 12 28 8 20 16 16 C 14 8 30 4 38 12 C 46 4 64 10 64 20 C 74 20 78 30 68 34 L 26 34 C 16 36 12 30 22 28 Z"
        fill={slate}
        opacity="0.22"
      />
      {/* 눈송이 — 흰 원 + 회색 외곽, 상·중단 영역 */}
      {SNOW_FLAKES.map(([cx, cy, r], i) => (
        <g key={i} opacity="0.65">
          <circle cx={cx} cy={cy} r={r} fill={white} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={slate} strokeWidth="0.8" opacity="0.55" />
        </g>
      ))}
    </g>
  )
}

function SunnyLayer() {
  const gold = '#F59E0B'
  const cream = '#FCD34D'
  return (
    <g>
      <defs>
        <radialGradient id="sunGlow" cx="0.78" cy="0.18" r="0.7">
          <stop offset="0%" stopColor={cream} stopOpacity="0.40" />
          <stop offset="55%" stopColor={cream} stopOpacity="0.14" />
          <stop offset="100%" stopColor={cream} stopOpacity="0.02" />
        </radialGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#sunGlow)" />
      {/* 태양 디스크 */}
      <circle cx={156} cy={50} r={20} fill={cream} opacity="0.55" />
      <circle cx={156} cy={50} r={14} fill={gold} opacity="0.35" />
      {/* 햇살 광선 — 우상단에서 방사 */}
      {SUN_RAYS.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={gold}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.45"
        />
      ))}
    </g>
  )
}

function WindyLayer() {
  const teal = '#7EC8C8'
  return (
    <g>
      <defs>
        <linearGradient id="windTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={teal} stopOpacity="0.16" />
          <stop offset="100%" stopColor={teal} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#windTint)" />
      {/* 부드러운 바람 곡선 — 좌→우 흐름, 상·중단 */}
      {WIND_CURVES.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={teal}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.50"
        />
      ))}
    </g>
  )
}

// 좌표 테이블 — [x, y, length]
const RAIN_DROP_LIGHT: [number, number, number][] = [
  [40, 50, 10],
  [62, 64, 10],
  [88, 52, 10],
  [110, 70, 10],
  [134, 56, 10],
  [156, 72, 10],
  [180, 60, 10],
  [50, 82, 10],
  [96, 88, 10],
  [144, 92, 10],
]

const RAIN_DROP_HEAVY: [number, number, number][] = [
  [30, 56, 14],
  [50, 72, 14],
  [70, 60, 14],
  [90, 80, 14],
  [110, 64, 14],
  [130, 84, 14],
  [150, 70, 14],
  [170, 90, 14],
  [40, 100, 14],
  [80, 108, 14],
  [120, 104, 14],
  [160, 112, 14],
  [60, 128, 14],
  [100, 132, 14],
  [140, 134, 14],
]

// [cx, cy, r]
const SNOW_FLAKES: [number, number, number][] = [
  [36, 52, 3.2],
  [62, 70, 2.4],
  [88, 56, 3.0],
  [114, 74, 2.6],
  [140, 60, 3.2],
  [166, 76, 2.4],
  [50, 96, 2.8],
  [94, 102, 3.0],
  [138, 104, 2.6],
  [178, 100, 3.0],
  [28, 124, 2.4],
  [110, 130, 2.8],
  [156, 134, 2.4],
]

// 햇살 광선 — 우상단 156,50 중심에서 방사
const SUN_RAYS: [number, number, number, number][] = [
  [156, 18, 156, 26],
  [180, 30, 188, 22],
  [186, 50, 196, 50],
  [180, 70, 188, 78],
  [132, 30, 124, 22],
  [126, 50, 116, 50],
  [132, 70, 124, 78],
  [156, 82, 156, 90],
]

const WIND_CURVES: string[] = [
  'M 12 70 Q 60 60 100 72 T 192 70',
  'M 12 102 Q 50 92 90 100 T 168 100',
  'M 24 138 Q 70 130 110 140 T 192 138',
  'M 12 178 Q 60 170 100 178 T 188 174',
]

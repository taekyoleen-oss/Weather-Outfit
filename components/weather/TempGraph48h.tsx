'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, Label,
} from 'recharts'
import type { HourlyForecast, SunriseSunset, DailyForecast } from '@/types/weather'
import { currentHourKst, kstTodayYmd } from '@/lib/utils/timeOfDay'
import { weatherLabel, formatTemp1 } from '@/lib/utils/formatWeather'

interface Props {
  hourly: HourlyForecast[]
  loading?: boolean
  sunriseSunset?: SunriseSunset | null
  daily?: DailyForecast[]
}

/** 화면에 동시에 보이는 시간 수. 컨테이너 폭을 이만큼으로 나눠 1시간 폭을 산출 */
const VISIBLE_HOURS = 24
/** 시간 1칸 최소 폭(px) — 좁은 화면에서 가독성이 너무 떨어지지 않도록 하한 */
const MIN_HOUR_WIDTH = 14
const CHART_HEIGHT = 160
/** 상단 마커(오늘·내일·일출 등)·하단 시간 라벨 공간 확보 */
const MARGIN = { top: 28, right: 18, left: 6, bottom: 18 }
const TOOLTIP_STYLE = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  fontSize: 12,
  padding: '4px 8px',
}
const ACTIVE_DOT = { r: 4, fill: '#FFB547', strokeWidth: 0 }
const YAXIS_TICK = { fontSize: 10, fill: '#64748B' }

const WEATHER_EMOJI: Record<string, string> = {
  '맑음': '☀️', '구름 많음': '🌤', '흐림': '☁️',
  '비': '🌧', '비/눈': '🌨', '눈': '❄️', '소나기': '⛈',
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function parseHmHour(hm: string): number | null {
  const compact = hm.trim().replace(':', '')
  const n = parseInt(compact, 10)
  return Number.isFinite(n) ? Math.floor(n / 100) : null
}

function mmdd(dateStr: string): string {
  return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
}

function dayOfWeek(dateStr: string): string {
  const y = parseInt(dateStr.slice(0, 4), 10)
  const mo = parseInt(dateStr.slice(4, 6), 10) - 1
  const d = parseInt(dateStr.slice(6, 8), 10)
  return DAY_LABELS[new Date(Date.UTC(y, mo, d, 12)).getUTCDay()] ?? ''
}

function dayRelativeLabel(dateStr: string, todayYmd: string): string {
  const delta = Math.round(
    (Date.UTC(+dateStr.slice(0, 4), +dateStr.slice(4, 6) - 1, +dateStr.slice(6, 8))
      - Date.UTC(+todayYmd.slice(0, 4), +todayYmd.slice(4, 6) - 1, +todayYmd.slice(6, 8)))
    / 86400000,
  )
  if (delta === 0) return '오늘'
  if (delta === 1) return '내일'
  if (delta === 2) return '모레'
  return dayOfWeek(dateStr)
}

type MarkerType = 'today' | 'tomorrow' | 'dayafter' | 'other-day' | 'sunrise' | 'sunset'

interface PointData {
  /** 고유 키 — XAxis dataKey & ReferenceLine x 양쪽에서 같은 슬롯을 지목하기 위해 사용 */
  key: string
  /** 하단 x축에 표시할 시간 (예: "9시"), 공란이면 표시하지 않음 */
  hourLabel: string
  /** 툴팁에 표시할 절대 시각 */
  fullLabel: string
  /** 온도(소수 1자리 반올림) */
  temp: number
  /** 상단 마커 라벨 (있으면 ReferenceLine + 라벨 표시) */
  topMarker: string
  markerType?: MarkerType
}

const MARKER_STYLE: Record<MarkerType, { color: string; dash?: string; bold: boolean }> = {
  today:    { color: '#16a34a', bold: true },
  tomorrow: { color: '#5B8DEE', bold: true },
  dayafter: { color: '#5B8DEE', bold: true },
  'other-day': { color: '#64748B', bold: true },
  sunrise:  { color: '#F59E0B', dash: '3 3', bold: false },
  sunset:   { color: '#818CF8', dash: '3 3', bold: false },
}

function makeBottomTick(dataByKey: Map<string, PointData>) {
  return function BottomTick(props: Record<string, unknown>) {
    const x = Number(props.x ?? 0)
    const y = Number(props.y ?? 0)
    const pl = props.payload as { value?: unknown } | undefined
    const key = String(pl?.value ?? '')
    const point = dataByKey.get(key)
    if (!point || !point.hourLabel) return <g />
    return (
      <text x={x} y={y + 12} textAnchor="middle" fill="#64748B" fontSize={10}>
        {point.hourLabel}
      </text>
    )
  }
}

function tooltipLabelFormatter(_: unknown, payload: ReadonlyArray<{ payload?: { fullLabel?: string } }>) {
  return payload?.[0]?.payload?.fullLabel ?? ''
}

function tooltipFormatter(v: unknown): [string, string] {
  return [`${typeof v === 'number' ? v.toFixed(1) : v}°`, '기온']
}

export function TempGraph48h({ hourly, loading, sunriseSunset, daily }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [viewportWidth, setViewportWidth] = useState(360)

  // 스크롤 컨테이너의 가시 폭을 추적 — 컨테이너 폭 = 24h 시각화 폭
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = Math.max(280, Math.floor(entries[0]!.contentRect.width))
      setViewportWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const chartData = useMemo<PointData[]>(() => {
    if (!hourly.length) return []
    const nowKst = currentHourKst()
    const todayYmd = kstTodayYmd()

    const sorted = [...hourly].sort((a, b) => {
      const ak = `${a.fcstDate ?? todayYmd}${a.time}`
      const bk = `${b.fcstDate ?? todayYmd}${b.time}`
      return ak.localeCompare(bk)
    })

    let startIdx = sorted.findIndex(
      (h) => (h.fcstDate === todayYmd || !h.fcstDate) && parseInt(h.time.split(':')[0], 10) >= nowKst,
    )
    if (startIdx < 0) startIdx = 0

    const sliced = sorted.slice(startIdx, startIdx + 48)

    const srHour = sunriseSunset?.sunrise ? parseHmHour(sunriseSunset.sunrise) : null
    const ssHour = sunriseSunset?.sunset ? parseHmHour(sunriseSunset.sunset) : null

    let prevHour: number | null = null
    let dayCount = 0
    let sunriseShown = false
    let sunsetShown = false

    return sliced.map((h, i) => {
      const hourNum = parseInt(h.time.split(':')[0], 10)
      const isMidnight = prevHour !== null && hourNum < prevHour
      if (isMidnight) dayCount++
      const d = h.fcstDate ?? todayYmd

      // 하단: 3시간 간격으로 시간 라벨
      const hourLabel = hourNum % 3 === 0 ? `${hourNum}시` : ''

      // 상단 마커: 시작점·자정·일출·일몰
      let topMarker = ''
      let markerType: MarkerType | undefined
      if (i === 0) {
        topMarker = '오늘'
        markerType = 'today'
      } else if (isMidnight) {
        if (dayCount === 1) { topMarker = '내일'; markerType = 'tomorrow' }
        else if (dayCount === 2) { topMarker = '모레'; markerType = 'dayafter' }
        else { topMarker = mmdd(d); markerType = 'other-day' }
      } else if (srHour !== null && hourNum === srHour && !sunriseShown) {
        topMarker = '일출'
        markerType = 'sunrise'
        sunriseShown = true
      } else if (ssHour !== null && hourNum === ssHour && !sunsetShown) {
        topMarker = '일몰'
        markerType = 'sunset'
        sunsetShown = true
      }

      prevHour = hourNum
      return {
        key: `${d}_${h.time}`,
        hourLabel,
        fullLabel: `${mmdd(d)} ${h.time.slice(0, 5)}`,
        temp: Math.round(h.temperature * 10) / 10,
        topMarker,
        markerType,
      }
    })
  }, [hourly, sunriseSunset])

  const dataByKey = useMemo(() => {
    const m = new Map<string, PointData>()
    for (const p of chartData) m.set(p.key, p)
    return m
  }, [chartData])

  /** 스크롤 진입 시 처음에 24h가 보이도록 좌측 정렬(=scrollLeft 0). 데이터 갱신 시 재정렬. */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
  }, [chartData])

  if (loading || !hourly.length) {
    return (
      <div className="glass-card p-3 sm:p-4">
        <p className="text-base font-semibold mb-2" style={{ color: 'var(--muted)' }}>
          48시간 기온
        </p>
        <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  // 24h가 viewportWidth에 들어가도록 시간당 폭을 계산. 데이터가 24h 미만이면 viewport 전체 사용.
  const hourWidth = Math.max(MIN_HOUR_WIDTH, Math.floor(viewportWidth / VISIBLE_HOURS))
  const chartInnerWidth = Math.max(viewportWidth, chartData.length * hourWidth)
  const bottomTick = makeBottomTick(dataByKey)
  const markedPoints = chartData.filter((p) => p.topMarker && p.markerType)
  const todayYmd = kstTodayYmd()

  const hasMarker = (t: MarkerType) => markedPoints.some((p) => p.markerType === t)

  return (
    <div className="glass-card p-3 sm:p-4">
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--muted)' }}>
        48시간 기온
      </h3>

      {/* 가로 스크롤 컨테이너: 화면에 24h만 보이고, 우측으로 스크롤하면 나머지 24h가 이어짐 */}
      <div
        ref={scrollRef}
        className="relative w-full overflow-x-auto scroll-strip"
        aria-label="48시간 기온 그래프 — 우측으로 스크롤하여 이후 시간대 확인"
      >
        <div style={{ width: chartInnerWidth, height: CHART_HEIGHT }}>
          <AreaChart
            width={chartInnerWidth}
            height={CHART_HEIGHT}
            data={chartData}
            margin={MARGIN}
          >
            <defs>
              <linearGradient id="wf-temp48-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor="#FFB547" stopOpacity={0.28} />
                <stop offset="90%" stopColor="#FFB547" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="key"
              tick={bottomTick}
              axisLine={false}
              tickLine={false}
              interval={0}
              padding={{ left: 6, right: 6 }}
            />
            <YAxis
              tick={YAXIS_TICK}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              width={26}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={tooltipLabelFormatter}
              formatter={tooltipFormatter}
            />

            {markedPoints.map((p) => {
              const style = MARKER_STYLE[p.markerType!]
              return (
                <ReferenceLine
                  key={`mark-${p.key}`}
                  x={p.key}
                  stroke={style.color}
                  strokeWidth={style.bold ? 1.5 : 1}
                  strokeDasharray={style.dash}
                  strokeOpacity={style.bold ? 0.7 : 0.5}
                  ifOverflow="extendDomain"
                >
                  <Label
                    value={p.topMarker}
                    position="top"
                    offset={6}
                    fill={style.color}
                    fontSize={10}
                    fontWeight={style.bold ? 700 : 500}
                  />
                </ReferenceLine>
              )
            })}

            <Area
              type="monotone"
              dataKey="temp"
              stroke="#FFB547"
              strokeWidth={2}
              fill="url(#wf-temp48-grad)"
              dot={false}
              activeDot={ACTIVE_DOT}
            />
          </AreaChart>
        </div>
      </div>

      {/* 범례 */}
      {(hasMarker('tomorrow') || hasMarker('dayafter') || hasMarker('sunrise') || hasMarker('sunset')) && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 px-1">
          <span className="text-[10px]" style={{ color: '#64748B' }}>← 좌우 스크롤 →</span>
          {(hasMarker('tomorrow') || hasMarker('dayafter')) && (
            <span className="text-[10px]" style={{ color: '#5B8DEE' }}>
              ━━ 내일/모레
            </span>
          )}
          {hasMarker('sunrise') && (
            <span className="text-[10px]" style={{ color: '#F59E0B' }}>
              ┄┄ 일출
            </span>
          )}
          {hasMarker('sunset') && (
            <span className="text-[10px]" style={{ color: '#818CF8' }}>
              ┄┄ 일몰
            </span>
          )}
        </div>
      )}

      {/* 주간 예보 */}
      {daily && daily.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>주간 예보</p>
          <div className="space-y-0.5">
            {daily.map((d) => {
              const lbl = weatherLabel(d.skyCode, d.ptyCode)
              const emoji = WEATHER_EMOJI[lbl] ?? '🌤'
              const isExpanded = expandedDay === d.date
              const dayName = dayRelativeLabel(d.date, todayYmd)

              return (
                <div key={d.date}>
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : d.date)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors text-left"
                    style={{ background: isExpanded ? 'rgba(255,255,255,0.5)' : 'transparent' }}
                    aria-expanded={isExpanded}
                  >
                    <span
                      className="w-7 text-xs font-semibold flex-shrink-0"
                      style={{ color: dayName === '오늘' ? 'var(--accent)' : 'var(--muted)' }}
                    >
                      {dayName}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>
                      {mmdd(d.date)}
                    </span>
                    <span className="text-base flex-1">{emoji}</span>
                    {d.pop > 0 && (
                      <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: 'var(--humidity)' }}>
                        {d.pop}%
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 tabular-nums">
                      <span style={{ color: '#5B8DEE' }}>{formatTemp1(d.minTemp)}°</span>
                      <span style={{ color: 'var(--muted)' }}>/</span>
                      <span style={{ color: '#F0A04B' }}>{formatTemp1(d.maxTemp)}°</span>
                    </div>
                    {d.hourly && d.hourly.length > 0 && (
                      <span
                        className="text-[10px] flex-shrink-0"
                        style={{
                          display: 'inline-block',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          color: 'var(--muted)',
                        }}
                      >
                        ▾
                      </span>
                    )}
                  </button>

                  {isExpanded && d.hourly && d.hourly.length > 0 && (
                    <div className="px-2 pb-2 overflow-x-auto scroll-strip">
                      <div className="flex gap-3 pb-1">
                        {d.hourly.map((hh, i) => (
                          <div key={i} className="flex flex-col items-center gap-0.5 min-w-[40px] text-center">
                            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                              {hh.time.slice(0, 2)}시
                            </span>
                            <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                              {formatTemp1(hh.temperature)}°
                            </span>
                            {hh.pop > 0 && (
                              <span className="text-[10px] tabular-nums" style={{ color: 'var(--humidity)' }}>
                                {hh.pop}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

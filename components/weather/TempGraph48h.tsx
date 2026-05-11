'use client'

import { useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
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

const MARGIN = { top: 8, right: 8, left: -22, bottom: 0 }
const TOOLTIP_STYLE = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  fontSize: 12,
  padding: '4px 8px',
}

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
    (Date.UTC(+dateStr.slice(0,4), +dateStr.slice(4,6)-1, +dateStr.slice(6,8))
     - Date.UTC(+todayYmd.slice(0,4), +todayYmd.slice(4,6)-1, +todayYmd.slice(6,8)))
    / 86400000
  )
  if (delta === 0) return '오늘'
  if (delta === 1) return '내일'
  if (delta === 2) return '모레'
  return dayOfWeek(dateStr)
}

export function TempGraph48h({ hourly, loading, sunriseSunset, daily }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const srHour = useMemo(
    () => (sunriseSunset?.sunrise ? parseHmHour(sunriseSunset.sunrise) : null),
    [sunriseSunset],
  )
  const ssHour = useMemo(
    () => (sunriseSunset?.sunset ? parseHmHour(sunriseSunset.sunset) : null),
    [sunriseSunset],
  )

  const chartData = useMemo(() => {
    if (!hourly.length) return []
    const nowKst = currentHourKst()
    const todayYmd = kstTodayYmd()

    const sorted = [...hourly].sort((a, b) => {
      const ak = `${a.fcstDate ?? todayYmd}${a.time}`
      const bk = `${b.fcstDate ?? todayYmd}${b.time}`
      return ak.localeCompare(bk)
    })

    let startIdx = sorted.findIndex(
      (h) => (h.fcstDate === todayYmd || !h.fcstDate) && parseInt(h.time.split(':')[0], 10) >= nowKst
    )
    if (startIdx < 0) startIdx = 0

    const sliced = sorted.slice(startIdx, startIdx + 48)
    let prevHour: number | null = null
    let dayCount = 0

    return sliced.map((h, i) => {
      const hourNum = parseInt(h.time.split(':')[0], 10)
      const isMidnight = prevHour !== null && hourNum < prevHour
      if (isMidnight) dayCount++
      const d = h.fcstDate ?? todayYmd

      let label: string
      if (i === 0) {
        label = '지금'
      } else if (isMidnight) {
        if (dayCount === 1) label = '내일'
        else if (dayCount === 2) label = '모레'
        else label = mmdd(d)
      } else if (hourNum === srHour) {
        label = '일출'
      } else if (hourNum === ssHour) {
        label = '일몰'
      } else if (hourNum % 6 === 0) {
        label = `${String(hourNum).padStart(2, '0')}시`
      } else {
        label = ''
      }

      prevHour = hourNum
      return {
        label,
        fullLabel: `${d.slice(4, 6)}/${d.slice(6, 8)} ${h.time.slice(0, 5)}`,
        temp: Math.round(h.temperature * 10) / 10,
      }
    })
  }, [hourly, srHour, ssHour])

  const hasTomorrow = chartData.some(d => d.label === '내일')
  const hasDayAfter = chartData.some(d => d.label === '모레')
  const hasSunrise = chartData.some(d => d.label === '일출')
  const hasSunset = chartData.some(d => d.label === '일몰')

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

  const todayYmd = kstTodayYmd()

  return (
    <div className="glass-card p-3 sm:p-4">
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--muted)' }}>
        48시간 기온
      </h3>

      {/* 48시간 기온 차트 */}
      <div className="min-w-0 w-full" style={{ minHeight: 120 }}>
        <ResponsiveContainer width="100%" height={120} debounce={50}>
          <AreaChart data={chartData} margin={MARGIN}>
            <defs>
              <linearGradient id="wf-temp48-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor="#FFB547" stopOpacity={0.28} />
                <stop offset="90%" stopColor="#FFB547" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={(props: Record<string, unknown>) => {
                const x = Number(props.x ?? 0)
                const y = Number(props.y ?? 0)
                const pl = props.payload as { value?: unknown } | undefined
                const v = String(pl?.value ?? '')
                let fill = '#64748B'
                let fontWeight = 400
                if (v === '내일' || v === '모레') { fill = '#5B8DEE'; fontWeight = 700 }
                else if (v === '일출') fill = '#F59E0B'
                else if (v === '일몰') fill = '#818CF8'
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill={fill}
                    fontSize={10}
                    fontWeight={fontWeight}
                  >
                    {v}
                  </text>
                )
              }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              width={26}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ''}
              formatter={(v: unknown) => [`${typeof v === 'number' ? v.toFixed(1) : v}°`, '기온']}
            />
            {hasTomorrow && (
              <ReferenceLine x="내일" stroke="#5B8DEE" strokeDasharray="4 3" strokeOpacity={0.55} />
            )}
            {hasDayAfter && (
              <ReferenceLine x="모레" stroke="#5B8DEE" strokeDasharray="4 3" strokeOpacity={0.55} />
            )}
            {hasSunrise && (
              <ReferenceLine x="일출" stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.45} />
            )}
            {hasSunset && (
              <ReferenceLine x="일몰" stroke="#818CF8" strokeDasharray="3 3" strokeOpacity={0.45} />
            )}
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#FFB547"
              strokeWidth={2}
              fill="url(#wf-temp48-grad)"
              dot={false}
              activeDot={{ r: 4, fill: '#FFB547', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      {(hasTomorrow || hasSunrise || hasSunset) && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 px-1">
          {hasTomorrow && (
            <span className="text-[10px]" style={{ color: '#5B8DEE' }}>
              ━━ 내일/모레
            </span>
          )}
          {hasSunrise && (
            <span className="text-[10px]" style={{ color: '#F59E0B' }}>
              ┄┄ 일출
            </span>
          )}
          {hasSunset && (
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

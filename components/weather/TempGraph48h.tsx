'use client'

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { HourlyForecast } from '@/types/weather'
import { currentHourKst, kstTodayYmd } from '@/lib/utils/timeOfDay'

interface Props {
  hourly: HourlyForecast[]
  loading?: boolean
}

const MARGIN = { top: 8, right: 8, left: -22, bottom: 0 }
const TOOLTIP_STYLE = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  fontSize: 12,
  padding: '4px 8px',
}

export function TempGraph48h({ hourly, loading }: Props) {
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

    return sliced.map((h, i) => {
      const hourNum = parseInt(h.time.split(':')[0], 10)
      const isMidnight = prevHour !== null && hourNum < prevHour
      const d = h.fcstDate ?? todayYmd
      let label: string
      if (i === 0) {
        label = '지금'
      } else if (isMidnight) {
        label = `${d.slice(4, 6)}/${d.slice(6, 8)}`
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
  }, [hourly])

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

  return (
    <div className="glass-card p-3 sm:p-4">
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--muted)' }}>
        48시간 기온
      </h3>
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
              tick={{ fontSize: 10, fill: '#64748B' }}
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
    </div>
  )
}

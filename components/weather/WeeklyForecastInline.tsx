'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailyForecast, HourlyForecast } from '@/types/weather'
import { weatherLabel } from '@/lib/utils/formatWeather'

interface Props {
  daily: DailyForecast[]
  hourly: HourlyForecast[]
  loading?: boolean
}

const WEATHER_EMOJI: Record<string, string> = {
  '맑음': '☀️',
  '구름 많음': '🌤',
  '흐림': '☁️',
  '비': '🌧',
  '비/눈': '🌨',
  '눈': '❄️',
  '소나기': '⛈',
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function dayLabel(dateStr: string): string {
  const d = new Date(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(4, 6)) - 1,
    parseInt(dateStr.slice(6, 8))
  )
  return DAY_LABELS[d.getDay()]
}

function mmdd(dateStr: string): string {
  return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
}

export function WeeklyForecastInline({ daily, hourly, loading }: Props) {
  const [tab, setTab] = useState<'today' | 'week'>('today')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  return (
    <div className="glass-card p-3 sm:p-5 min-w-0 max-w-full overflow-x-hidden">
      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-white/40 rounded-xl p-1 w-fit">
        {(['today', 'week'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
            style={{
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? 'var(--primary)' : 'var(--muted)',
              boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
            aria-pressed={tab === t}
          >
            {t === 'today' ? '오늘' : '주간'}
          </button>
        ))}
      </div>

      {tab === 'today' && <TodayView hourly={hourly} loading={loading} />}
      {tab === 'week' && (
        <WeekView
          daily={daily}
          loading={loading}
          expandedDay={expandedDay}
          onToggleDay={(d) => setExpandedDay(expandedDay === d ? null : d)}
        />
      )}
    </div>
  )
}

function TodayView({ hourly, loading }: { hourly: HourlyForecast[]; loading?: boolean }) {
  if (loading || !hourly.length) {
    return (
      <div className="h-40 flex items-center justify-center animate-pulse">
        <div className="w-full h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  const chartData = hourly.slice(0, 12).map((h) => ({
    time: h.time.slice(0, 5),
    temp: Math.round(h.temperature),
    pop: h.pop,
  }))

  return (
    <div className="min-w-0 w-full max-w-full">
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              fontSize: 12,
            }}
            formatter={(v) => [`${v}°`, '기온']}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#FFB547"
            strokeWidth={2.5}
            dot={{ fill: '#FFB547', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#FFB547' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function WeekView({
  daily,
  loading,
  expandedDay,
  onToggleDay,
}: {
  daily: DailyForecast[]
  loading?: boolean
  expandedDay: string | null
  onToggleDay: (d: string) => void
}) {
  if (loading || !daily.length) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  const chartData = daily.map((d) => ({
    date: mmdd(d.date),
    min: d.minTemp,
    max: d.maxTemp,
  }))

  return (
    <div className="space-y-2">
      {/* Line chart */}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: 12 }}
          />
          <Line type="monotone" dataKey="max" stroke="#F0A04B" strokeWidth={2} dot={{ r: 3, fill: '#F0A04B', strokeWidth: 0 }} name="최고" />
          <Line type="monotone" dataKey="min" stroke="#5B8DEE" strokeWidth={2} dot={{ r: 3, fill: '#5B8DEE', strokeWidth: 0 }} name="최저" />
        </LineChart>
      </ResponsiveContainer>

      {/* Day cards */}
      <div className="space-y-1.5 mt-3">
        {daily.map((d) => {
          const label = weatherLabel(d.skyCode, d.ptyCode)
          const emoji = WEATHER_EMOJI[label] ?? '🌤'
          const isExpanded = expandedDay === d.date

          return (
            <div key={d.date}>
              <button
                onClick={() => onToggleDay(d.date)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/60 transition-colors text-left"
                aria-expanded={isExpanded}
              >
                <span className="w-8 text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  {dayLabel(d.date)}
                </span>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>{mmdd(d.date)}</span>
                <span className="text-xl flex-1">{emoji}</span>
                {d.pop > 0 && (
                  <span className="text-xs" style={{ color: 'var(--humidity)' }}>{d.pop}%</span>
                )}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span style={{ color: '#5B8DEE' }}>{d.minTemp}°</span>
                  <span style={{ color: 'var(--muted)' }}>/</span>
                  <span style={{ color: '#F0A04B' }}>{d.maxTemp}°</span>
                </div>
                <span
                  className="text-xs transition-transform"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--muted)' }}
                >
                  ▾
                </span>
              </button>

              {isExpanded && d.hourly && (
                <div className="px-3 pb-2">
                  <div className="flex gap-2 overflow-x-auto scroll-strip pb-1">
                    {d.hourly.map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 min-w-[44px] text-center">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{h.time.slice(0, 2)}시</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{Math.round(h.temperature)}°</span>
                        {h.pop > 0 && (
                          <span className="text-xs" style={{ color: 'var(--humidity)' }}>{h.pop}%</span>
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
  )
}

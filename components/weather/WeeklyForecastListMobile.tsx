'use client'

import Image from 'next/image'
import type { DailyForecast, SkyCode, PtyCode } from '@/types/weather'
import { pickIllustKey, illustFile } from '@/lib/utils/formatWeather'

interface Props {
  /** 오늘 포함 최대 8일치 일별 예보 (`mergeWeeklyDailyFromToday` 결과 권장) */
  daily: DailyForecast[]
  /** 헤더에 표시할 위치 이름 (옵션) */
  locationName?: string
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function dayLabel(dateStr: string): string {
  const y = parseInt(dateStr.slice(0, 4), 10)
  const mo = parseInt(dateStr.slice(4, 6), 10) - 1
  const d = parseInt(dateStr.slice(6, 8), 10)
  const utc = new Date(Date.UTC(y, mo, d, 12, 0, 0))
  return DAY_LABELS[utc.getUTCDay()] ?? ''
}

function mmdd(dateStr: string): string {
  return `${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`
}

function rowLeftLabel(dateStr: string, idx: number): string {
  if (idx === 0) return '오늘'
  if (idx === 1) return '내일'
  return dayLabel(dateStr)
}

function iconSrc(sky?: SkyCode, pty?: PtyCode, period: 'morning' | 'day' = 'day'): string {
  const key = pickIllustKey(sky ?? '3', pty ?? '0')
  return `/illust/weather/${illustFile(key, period)}.svg`
}

function PopText({ pop }: { pop?: number }) {
  if (pop == null || !Number.isFinite(pop)) return <span className="text-[11px]" style={{ color: 'var(--muted)' }}>—</span>
  return (
    <span className="text-[13px] font-semibold tabular-nums" style={{ color: '#1d4ed8' }}>
      {Math.round(pop)}%
    </span>
  )
}

export function WeeklyForecastListMobile({ daily, locationName }: Props) {
  const rows: (DailyForecast | null)[] = []
  for (let i = 0; i < 8; i++) {
    rows.push(daily[i] ?? null)
  }

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--surface-border)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
          {locationName ? `${locationName} 주간예보` : '주간예보'}
        </h3>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ background: 'var(--colors-surface-filter)', color: 'var(--muted)' }}
          title="기상청 단기예보(오늘~+2일)와 중기예보(+3~+7일)를 결합한 8일 예보. 오전(07~12시)·오후(13~18시) 강수확률 분리 표시."
        >
          ⓘ
        </span>
      </div>
      <ul className="divide-y" style={{ borderColor: 'var(--surface-border)' }}>
        {rows.map((d, idx) => {
          if (!d) {
            return (
              <li
                key={`placeholder-${idx}`}
                className="grid grid-cols-[68px_1fr_1fr_72px] items-center gap-2 px-4 py-3 opacity-50"
              >
                <span className="text-[12px]" style={{ color: 'var(--muted)' }}>—</span>
                <span />
                <span />
                <span className="text-right text-[12px]" style={{ color: 'var(--muted)' }}>—</span>
              </li>
            )
          }
          const left = rowLeftLabel(d.date, idx)
          const amSky = d.amSkyCode ?? d.skyCode
          const amPty = d.amPtyCode ?? d.ptyCode
          const pmSky = d.pmSkyCode ?? d.skyCode
          const pmPty = d.pmPtyCode ?? d.ptyCode
          return (
            <li
              key={d.date}
              className="grid grid-cols-[68px_1fr_1fr_72px] items-center gap-2 px-4 py-2.5"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{left}</span>
                <span className="text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>{mmdd(d.date)}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <PopText pop={d.amPop} />
                <Image
                  src={iconSrc(amSky, amPty, 'morning')}
                  alt={`오전 ${amPty !== '0' ? '강수' : '하늘'}`}
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0"
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Image
                  src={iconSrc(pmSky, pmPty, 'day')}
                  alt={`오후 ${pmPty !== '0' ? '강수' : '하늘'}`}
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0"
                />
                <PopText pop={d.pmPop} />
              </div>
              <div className="text-right tabular-nums whitespace-nowrap">
                <span className="text-sm font-bold" style={{ color: '#1d4ed8' }}>{Math.round(d.minTemp)}°</span>
                <span className="text-sm font-bold mx-0.5" style={{ color: 'var(--muted)' }}>/</span>
                <span className="text-sm font-bold" style={{ color: '#dc2626' }}>{Math.round(d.maxTemp)}°</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

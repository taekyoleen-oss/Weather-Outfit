'use client'

import type { SkyCode, PtyCode } from '@/types/weather'
import { weatherLabel, formatTemp1 } from '@/lib/utils/formatWeather'

export interface Strip10mSlot {
  minuteOffset: number
  timeKst: string
  temperature: number
  skyCode: string
  ptyCode: string
  precipitation: number
  windSpeed: number
  humidity: number
  lgt: number
}

export interface LightningStatus {
  level: 'none' | 'watch' | 'warning'
  message: string
}

interface Props {
  strip10m: Strip10mSlot[]
  lightningNow: LightningStatus
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

const PTY_LABEL: Record<string, string> = {
  '0': '-',
  '1': '비',
  '2': '비/눈',
  '3': '눈',
  '4': '소나기',
}

function ltStyle(level: LightningStatus['level']) {
  if (level === 'warning')
    return { color: '#b91c1c', icon: '⚡', label: '낙뢰 경계' }
  if (level === 'watch')
    return { color: '#b45309', icon: '⚡', label: '낙뢰 주의' }
  return { color: '#15803d', icon: '✓', label: '낙뢰 없음' }
}

interface SlotColProps {
  timeLabel: string
  isCurrent?: boolean
  temperature: number
  skyCode: string
  ptyCode: string
  precipitation: number
  windSpeed: number
  humidity: number
  lgt: number
}

function SlotCol({
  timeLabel,
  isCurrent,
  temperature,
  skyCode,
  ptyCode,
  precipitation,
  windSpeed,
  humidity,
  lgt,
}: SlotColProps) {
  const label = weatherLabel(skyCode as SkyCode, ptyCode as PtyCode)
  const emoji = WEATHER_EMOJI[label] ?? '🌤'
  const hasPrecip = precipitation > 0
  const hasPty = ptyCode !== '0'
  const hasLgt = lgt > 0

  return (
    <div
      className="grid grid-rows-[14px_20px_14px_14px_14px_14px_14px_14px] items-center min-w-[52px] sm:min-w-[58px] py-1.5 px-1 rounded-xl text-center"
      style={{
        background: isCurrent ? 'rgba(255,181,71,0.12)' : 'transparent',
        border: isCurrent
          ? '1px solid rgba(255,181,71,0.3)'
          : '1px solid transparent',
      }}
    >
      {/* 시간 */}
      <span
        className="h-[14px] flex items-center justify-center text-xs font-medium"
        style={{ color: isCurrent ? 'var(--accent)' : 'var(--muted)' }}
      >
        {timeLabel}
      </span>

      {/* 날씨 아이콘 */}
      <span
        className="h-[20px] flex items-center justify-center text-xl leading-none"
        style={{
          fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
        }}
      >
        {emoji}
      </span>

      {/* 기온 */}
      <span
        className="h-[14px] flex items-center justify-center text-xs font-bold"
        style={{ color: 'var(--text)' }}
      >
        {Number.isFinite(temperature) ? `${formatTemp1(temperature)}°` : '-'}
      </span>

      {/* 강수형태 */}
      <span
        className="h-[14px] flex items-center justify-center"
        style={{ fontSize: 11, color: hasPty ? 'var(--humidity)' : 'var(--muted)' }}
      >
        {PTY_LABEL[ptyCode] ?? '-'}
      </span>

      {/* 강수량 */}
      <span
        className="h-[14px] flex items-center justify-center"
        style={{ fontSize: 11, color: hasPrecip ? 'var(--humidity)' : 'var(--muted)' }}
      >
        {hasPrecip ? precipitation.toFixed(1) : '-'}
      </span>

      {/* 풍속 */}
      <span
        className="h-[14px] flex items-center justify-center"
        style={{ fontSize: 11, color: 'var(--muted)' }}
      >
        {windSpeed.toFixed(1)}
      </span>

      {/* 습도 */}
      <span
        className="h-[14px] flex items-center justify-center"
        style={{ fontSize: 11, color: 'var(--muted)' }}
      >
        {Math.round(humidity)}
      </span>

      {/* 낙뢰 */}
      <span
        className="h-[14px] flex items-center justify-center"
        style={{ fontSize: 11, color: hasLgt ? '#b91c1c' : 'var(--muted)' }}
      >
        {hasLgt ? `⚡${lgt.toFixed(0)}` : '-'}
      </span>
    </div>
  )
}

export function UltraSrtFcstCard({ strip10m, lightningNow }: Props) {
  const lt = ltStyle(lightningNow.level)
  if (strip10m.length === 0) return null

  return (
    <div className="glass-card wf-hourly-strip p-3 sm:p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-base font-semibold" style={{ color: 'var(--muted)' }}>
          초단기예보
        </h3>
        <span className="text-xs font-semibold" style={{ color: lt.color }}>
          {lt.icon} {lt.label}
        </span>
      </div>

      {/* 본문: 라벨 열 + 슬롯 열들 */}
      <div className="flex gap-0.5 sm:gap-1 pb-1">
        {/* 좌측 고정 라벨 열 */}
        <div className="grid grid-rows-[14px_20px_14px_14px_14px_14px_14px_14px] min-w-[46px] sm:min-w-[54px] py-1.5 px-1 rounded-xl bg-white/35">
          <div className="h-[14px] flex items-center">
            <span className="text-[10px] select-none opacity-0" aria-hidden>시간</span>
          </div>
          <div className="h-[20px] flex items-center">
            <span className="text-[10px] select-none opacity-0" aria-hidden>아이콘</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>기온(°)</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>강수형태</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>강수량(mm)</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>풍속(m/s)</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>습도(%)</span>
          </div>
          <div className="h-[14px] flex items-center">
            <span className="font-semibold leading-none" style={{ fontSize: 10, color: 'var(--muted)' }}>낙뢰(kA)</span>
          </div>
        </div>

        {/* 스크롤 슬롯 영역 */}
        <div className="scroll-strip flex gap-1.5 sm:gap-2.5">
          {strip10m.map((s, i) => (
            <SlotCol
              key={`${s.timeKst}-${i}`}
              timeLabel={i === 0 ? '지금' : s.timeKst}
              isCurrent={i === 0}
              temperature={s.temperature}
              skyCode={s.skyCode}
              ptyCode={s.ptyCode}
              precipitation={s.precipitation}
              windSpeed={s.windSpeed}
              humidity={s.humidity}
              lgt={s.lgt}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

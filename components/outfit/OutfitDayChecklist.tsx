'use client'

import { useMemo } from 'react'
import type { CurrentWeather, DustData, WeatherAlert } from '@/types/weather'
import { feelsLike } from '@/lib/utils/formatWeather'

interface Props {
  weather: CurrentWeather
  dust: DustData | null
  alerts: WeatherAlert[]
  durationHours: number
  sensitivity: number
}

type Severity = 'ok' | 'info' | 'caution' | 'warning'

interface CheckItem {
  id: string
  icon: string
  label: string
  statusLabel: string
  severity: Severity
  triggered: boolean
  action: string
}

const SEVERITY_STYLES: Record<Severity, { bg: string; border: string; color: string; dot: string }> = {
  ok:      { bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.2)',  color: '#15803D', dot: '#22C55E' },
  info:    { bg: 'rgba(14,165,233,0.06)', border: 'rgba(14,165,233,0.2)', color: '#0369A1', dot: '#0EA5E9' },
  caution: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', color: '#92400E', dot: '#F59E0B' },
  warning: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  color: '#B91C1C', dot: '#EF4444' },
}

const SEVERITY_ICON: Record<Severity, string> = {
  ok:      '✓',
  info:    'ℹ',
  caution: '⚠️',
  warning: '🔴',
}

function hasAlert(alerts: WeatherAlert[], keywords: string[]) {
  return alerts.some((a) =>
    keywords.some((k) => a.type?.includes(k) || a.message?.includes(k) || a.level?.includes(k))
  )
}

function dustGradeLabel(grade: string | undefined): string {
  if (!grade) return '–'
  return grade === '1' ? '좋음' : grade === '2' ? '보통' : grade === '3' ? '나쁨' : '매우나쁨'
}

function o3GradeLabel(grade: string | undefined): string {
  if (!grade) return '–'
  return grade === '1' ? '좋음' : grade === '2' ? '보통' : grade === '3' ? '나쁨' : '매우나쁨'
}

export function OutfitDayChecklist({ weather, dust, alerts, durationHours, sensitivity }: Props) {
  const items = useMemo<CheckItem[]>(() => {
    const fl = feelsLike(weather.temperature, weather.windSpeed, weather.humidity) + sensitivity
    const uv = weather.uvIndex
    const pm10g = parseInt(dust?.pm10Grade ?? '0', 10)
    const pm25g = parseInt(dust?.pm25Grade ?? '0', 10)
    const o3g = parseInt(dust?.o3Grade ?? '0', 10)
    const windSpeed = weather.windSpeed
    const pty = weather.ptyCode
    const precip = weather.precipitation

    const strongWind = hasAlert(alerts, ['강풍'])
    const severeRain = hasAlert(alerts, ['호우', '홍수', '낙뢰', '뇌우']) || (pty === '4' && precip > 0)

    return [
      {
        id: 'uv',
        icon: '☀️',
        label: '자외선',
        statusLabel: `UV ${uv}${uv >= 8 ? ' 매우높음' : uv >= 6 ? ' 높음' : uv >= 3 ? ' 보통' : ' 낮음'}`,
        triggered: uv >= 6,
        severity: uv >= 8 ? 'warning' : 'caution',
        action: '긴팔·팔토시, 챙 넓은 모자, 선글라스, SPF50+ 선크림 준비',
      },
      {
        id: 'dust',
        icon: '😷',
        label: '미세먼지',
        statusLabel: `PM10 ${dustGradeLabel(dust?.pm10Grade)}${dust?.pm10Value != null ? ` (${dust.pm10Value}㎍)` : ''}`,
        triggered: pm10g >= 3 || pm25g >= 3,
        severity: pm10g >= 4 || pm25g >= 4 ? 'warning' : 'caution',
        action: 'KF80 이상 보건용 마스크 착용, 실외 활동 시간 단축',
      },
      {
        id: 'ozone',
        icon: '⚗️',
        label: '오존',
        statusLabel: `O₃ ${o3GradeLabel(dust?.o3Grade)}${dust?.o3Value != null ? ` (${dust.o3Value.toFixed(3)}ppm)` : ''}`,
        triggered: o3g >= 3,
        severity: o3g >= 4 ? 'warning' : 'caution',
        action: '한낮(10~16시) 야외 활동 자제, 이른 아침·저녁으로 조정',
      },
      {
        id: 'heat',
        icon: '🥵',
        label: '폭염',
        statusLabel: `체감 ${fl.toFixed(0)}℃`,
        triggered: fl >= 33,
        severity: 'warning',
        action: '밝은색 헐렁한 옷, 물 충분히, 그늘·실내 이용',
      },
      {
        id: 'cold',
        icon: '🥶',
        label: '한파·강풍',
        statusLabel: fl <= 0 ? `체감 ${fl.toFixed(0)}℃` : `풍속 ${windSpeed}m/s`,
        triggered: fl <= 0 || windSpeed >= 5,
        severity: fl <= -10 || windSpeed >= 14 ? 'warning' : 'caution',
        action: '방풍 외피, 장갑, 모자, 목도리로 노출 부위 차단',
      },
      {
        id: 'rain',
        icon: '🌧',
        label: '강수',
        statusLabel: pty === '0' ? '없음' : pty === '1' ? '비' : pty === '2' ? '비/눈' : pty === '3' ? '눈' : '소나기',
        triggered: pty !== '0',
        severity: 'caution',
        action: '우산 또는 방수 재킷, 미끄럼 적은 신발, 여벌 양말 준비',
      },
      {
        id: 'wind',
        icon: '🌬️',
        label: '강풍주의보',
        statusLabel: strongWind ? '주의보 발효' : `${windSpeed}m/s`,
        triggered: windSpeed >= 14 || strongWind,
        severity: 'warning',
        action: '야외 활동 자제, 우산 사용 지양, 낙하물 주의 구역 회피',
      },
      {
        id: 'severe',
        icon: '⛈️',
        label: '호우·낙뢰',
        statusLabel: severeRain ? '특보 발효' : '없음',
        triggered: severeRain,
        severity: 'warning',
        action: '등산·골프·강변 활동 즉시 취소, 실내 대체 필수',
      },
      {
        id: 'duration',
        icon: '⏱',
        label: '장시간 외출',
        statusLabel: `${durationHours}시간`,
        triggered: durationHours >= 1,
        severity: 'info',
        action: '물 챙기기, 2시간마다 선크림 재도포, 여벌 옷 여유 있게',
      },
      {
        id: 'sensitive',
        icon: '🩺',
        label: '민감군 설정',
        statusLabel: sensitivity === -2 ? '더위에 강함' : sensitivity === 2 ? '추위에 강함' : '보통',
        triggered: sensitivity === -2,
        severity: 'info',
        action: '미세먼지·오존 보통 단계에서도 마스크 구비, 보수적 판단 권장',
      },
    ]
  }, [weather, dust, alerts, durationHours, sensitivity])

  const triggered = items.filter((i) => i.triggered)
  const safe = items.filter((i) => !i.triggered)

  return (
    <div className="glass-card p-4 space-y-3 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
          📋 오늘 외출 체크리스트
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            background: triggered.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            color: triggered.length > 0 ? '#B91C1C' : '#15803D',
          }}
        >
          {triggered.length > 0 ? `${triggered.length}개 주의` : '모두 양호'}
        </span>
      </div>

      {/* Triggered items — prominent cards */}
      {triggered.length > 0 && (
        <div className="space-y-2">
          {triggered.map((item) => {
            const style = SEVERITY_STYLES[item.severity]
            return (
              <div
                key={item.id}
                className="rounded-xl p-3 flex gap-3"
                style={{ background: style.bg, border: `1px solid ${style.border}` }}
              >
                <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: style.color }}>{item.label}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: style.border, color: style.color }}
                    >
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text)' }}>
                    {item.action}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Safe items — compact list */}
      {safe.length > 0 && (
        <div
          className="rounded-xl px-3 py-2 space-y-1.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {safe.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-xs font-bold flex-shrink-0" style={{ color: '#22C55E' }}>✓</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.label}</span>
              <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: 'var(--muted)' }}>
                {item.statusLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

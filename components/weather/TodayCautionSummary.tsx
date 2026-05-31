'use client'

import { useMemo } from 'react'
import type { DustData, PollenData } from '@/types/weather'

interface Props {
  /** 현재 시각 자외선 지수 */
  uvIndex?: number
  /** 오늘 자외선 최댓값 */
  uvMax?: number
  dust?: DustData | null
  pollen?: PollenData | null
}

interface Caution {
  icon: string
  /** 앞에 색으로 강조되는 짧은 꼬리표 (예: "자외선 매우 높음") */
  tag: string
  color: string
  /** 행동요령 문장 */
  text: string
}

const POLLEN_KOR: Record<string, string> = { oak: '참나무', pine: '소나무', weeds: '잡초류' }

function riskLabel(risk: number): string {
  if (risk >= 3) return '매우 높음'
  if (risk === 2) return '높음'
  if (risk === 1) return '보통'
  return '낮음'
}

/**
 * 관심지역 날씨 탭 — 시간별 예보 위에 표시하는 "오늘 주의사항" 요약.
 * 자외선·대기질(미세먼지)·오존·꽃가루 중 '나쁨' 이상인 항목만 문장으로 안내한다.
 * 모두 양호하면 아무것도 렌더링하지 않는다.
 */
export function TodayCautionSummary({ uvIndex, uvMax, dust, pollen }: Props) {
  const cautions = useMemo<Caution[]>(() => {
    const out: Caution[] = []

    // ── 자외선 (오늘 최고 기준, 없으면 현재값) ──
    const uvPeak = uvMax ?? uvIndex
    if (typeof uvPeak === 'number' && uvPeak >= 6) {
      if (uvPeak >= 8) {
        out.push({
          icon: '☀️',
          tag: `자외선 매우 높음 (UV ${uvPeak})`,
          color: '#EF4444',
          text: '오전 10시~오후 3시엔 야외활동을 줄이고, 긴팔·챙 넓은 모자·선글라스와 SPF50+ 선크림을 꼭 챙기세요.',
        })
      } else {
        out.push({
          icon: '☀️',
          tag: `자외선 높음 (UV ${uvPeak})`,
          color: '#F59E0B',
          text: '한낮엔 그늘을 이용하고 모자·선글라스와 선크림을 챙기세요.',
        })
      }
    }

    // ── 대기질 (미세먼지 PM10 / 초미세먼지 PM2.5) ──
    const pm10g = parseInt(dust?.pm10Grade ?? '0', 10)
    const pm25g = parseInt(dust?.pm25Grade ?? '0', 10)
    const dustWorst = Math.max(pm10g || 0, pm25g || 0)
    if (dustWorst >= 3) {
      const which = pm25g >= pm10g ? '초미세먼지' : '미세먼지'
      if (dustWorst >= 4) {
        out.push({
          icon: '😷',
          tag: `${which} 매우 나쁨`,
          color: '#EF4444',
          text: '실외활동을 최소화하고, 외출 시 KF94 보건용 마스크를 착용하세요. 호흡기·심혈관 질환자는 가급적 실내에 머무르세요.',
        })
      } else {
        out.push({
          icon: '😷',
          tag: `${which} 나쁨`,
          color: '#F59E0B',
          text: 'KF80 이상 마스크를 착용하고, 조깅·등산 등 호흡량이 많은 운동은 자제하세요.',
        })
      }
    }

    // ── 오존 ──
    const o3g = parseInt(dust?.o3Grade ?? '0', 10)
    if (o3g >= 3) {
      out.push({
        icon: '⚗️',
        tag: o3g >= 4 ? '오존 매우 나쁨' : '오존 나쁨',
        color: o3g >= 4 ? '#EF4444' : '#F59E0B',
        text: '한낮(오후 2~5시) 실외 운동은 피하고, 어린이·노약자·호흡기 환자는 외출을 자제하세요.',
      })
    }

    // ── 꽃가루 (종별 최고 위험) ──
    if (pollen?.risks?.length) {
      let worst = -1
      let worstSpecies = ''
      for (const r of pollen.risks) {
        if (typeof r.todayRisk === 'number' && r.todayRisk > worst) {
          worst = r.todayRisk
          worstSpecies = r.species
        }
      }
      if (worst >= 2) {
        const name = POLLEN_KOR[worstSpecies] ?? '꽃가루'
        out.push({
          icon: '🌿',
          tag: `${name} 꽃가루 ${riskLabel(worst)}`,
          color: worst >= 3 ? '#EF4444' : '#F59E0B',
          text: '알레르기가 있다면 마스크·안경을 착용하고, 외출 후엔 옷을 털고 손·얼굴을 씻으세요.',
        })
      }
    }

    return out
  }, [uvIndex, uvMax, dust, pollen])

  if (cautions.length === 0) return null

  return (
    <div
      className="glass-card rounded-lg px-4 py-3 space-y-2"
      style={{ borderLeft: '3px solid #F59E0B' }}
    >
      <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
        ⚠️ 오늘 이런 점을 주의하세요
      </p>
      <div className="space-y-1.5">
        {cautions.map((c, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-sm flex-shrink-0 leading-snug">{c.icon}</span>
            <p className="text-xs leading-snug flex-1 min-w-0" style={{ color: 'var(--muted)' }}>
              <span style={{ color: c.color, fontWeight: 700 }}>{c.tag}</span>
              {' — '}
              {c.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

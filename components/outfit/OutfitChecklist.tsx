'use client'

import type { CurrentWeather, DustData, HourlyForecast } from '@/types/weather'
import type { CompanionProfile } from '@/lib/hooks/useCompanionProfile'

interface Props {
  weather: CurrentWeather | null
  dust: DustData | null
  hourly: HourlyForecast[]
  profile: CompanionProfile
}

interface Item { icon: string; text: string }

function build(
  weather: CurrentWeather,
  dust: DustData | null,
  hourly: HourlyForecast[],
  profile: CompanionProfile,
): Item[] {
  const items: Item[] = []
  const feels = weather.feelsLike
  const uv = weather.uvIndex ?? 0
  const wind = weather.windSpeed
  const maxPop = hourly.slice(0, 8).reduce((m, h) => Math.max(m, h.pop), 0)
  const hasPrecip = maxPop >= 50 || weather.precipitation > 0

  // 강수
  if (hasPrecip) items.push({ icon: '☂️', text: '우산 또는 방수 재킷' })

  // 바람
  if (wind >= 10) items.push({ icon: '🌬️', text: '바람막이 필수 — 강풍 주의' })
  else if (wind >= 6) items.push({ icon: '🌬️', text: '바람막이 겉옷' })

  // 체감 추위
  if (feels <= -10) {
    items.push({ icon: '🧤', text: '두꺼운 방한 장갑' })
    items.push({ icon: '🧣', text: '넥워머 / 목도리' })
    items.push({ icon: '🔥', text: '핫팩 필수' })
  } else if (feels <= 0) {
    items.push({ icon: '🧤', text: '방한 장갑' })
    items.push({ icon: '🔥', text: '핫팩' })
  } else if (feels <= 5) {
    items.push({ icon: '🧤', text: '얇은 장갑' })
  }

  // 자외선
  if (uv >= 8) {
    items.push({ icon: '🧴', text: '선크림 필수 (SPF 50+/PA+++)' })
    items.push({ icon: '🕶️', text: '자외선 차단 선글라스' })
    items.push({ icon: '🧢', text: '챙 넓은 모자' })
  } else if (uv >= 5) {
    items.push({ icon: '🧴', text: '선크림 (SPF 30+)' })
    items.push({ icon: '🧢', text: '모자' })
  } else if (uv >= 3) {
    items.push({ icon: '🧴', text: '선크림' })
  }

  // 미세먼지
  if (dust) {
    const vbad = dust.pm10Value >= 151 || dust.pm25Value >= 76
    const bad  = dust.pm10Value >= 81  || dust.pm25Value >= 36
    if (vbad) items.push({ icon: '😷', text: 'KF94 마스크 필수' })
    else if (bad) items.push({ icon: '😷', text: '마스크 착용 권장' })
  }

  // 폭염/더위
  if (feels >= 33) items.push({ icon: '⚠️', text: '폭염 주의 — 그늘·수분 자주 챙기기' })
  if (feels >= 27) items.push({ icon: '💧', text: '충분한 수분 섭취' })
  else if (feels >= 22) items.push({ icon: '💧', text: '물 챙기기' })

  // 프로필별 추가 항목
  if (profile === 'child') {
    items.push({ icon: '🎒', text: '아이 간식 · 여벌 옷' })
    if (uv >= 3) items.push({ icon: '🧴', text: '아이용 선크림 (PA+++)' })
    if (feels >= 25) items.push({ icon: '🧊', text: '쿨링 타올 · 아이스팩' })
    if (hasPrecip) items.push({ icon: '👟', text: '아이 방수 운동화' })
  }

  if (profile === 'senior') {
    if (feels >= 28) items.push({ icon: '⚠️', text: '어르신 열사병 주의 — 수분 · 그늘 필수' })
    if (feels <= 10) items.push({ icon: '🩺', text: '상비약 · 혈압약 확인' })
    items.push({ icon: '🩹', text: '구급약품 지참' })
  }

  if (profile === 'pet') {
    if (feels >= 28) items.push({ icon: '🐾', text: '반려동물 열사병 주의 — 물 · 그늘 필수' })
    if (feels <= 5) items.push({ icon: '🐾', text: '반려동물 방한복' })
    items.push({ icon: '💧', text: '반려동물 물 · 간식' })
    items.push({ icon: '🛁', text: '산책 후 발 닦기 준비' })
  }

  // 중복 제거
  const seen = new Set<string>()
  return items.filter(item => {
    const k = item.icon + item.text
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

const PROFILE_LABEL: Record<CompanionProfile, string> = {
  solo: '오늘의 챙길 것',
  child: '아이와 외출 — 챙길 것',
  senior: '어르신과 외출 — 챙길 것',
  pet: '반려동물과 외출 — 챙길 것',
}

export function OutfitChecklist({ weather, dust, hourly, profile }: Props) {
  if (!weather) return null
  const items = build(weather, dust, hourly, profile)
  if (!items.length) return null

  return (
    <div className="glass-card p-3 sm:p-4">
      <h3 className="text-base font-semibold mb-2.5" style={{ color: 'var(--muted)' }}>
        {PROFILE_LABEL[profile]}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text)' }}>
            <span className="text-lg leading-none flex-shrink-0" aria-hidden>{item.icon}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

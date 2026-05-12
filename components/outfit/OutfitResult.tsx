'use client'

import { useState, type ReactNode } from 'react'
import type {
  OutfitResult as OutfitResultType,
  OutfitItem,
  OutfitWeatherSnapshot,
  DangerLevel,
  GenderType,
} from '@/types/outfit'
import { OutfitItemCard } from './OutfitItemCard'
import { OutfitIllustPanel } from './OutfitIllustPanel'
import { formatTemp1 } from '@/lib/utils/formatWeather'
import { OUTFIT_PERIODS } from '@/lib/utils/timePeriods'

function resolveItemConditionText(item: OutfitItem, selectedPeriodIndices?: number[]): string {
  if (item.timePeriodIds?.length && selectedPeriodIndices?.length) {
    const selectedIds = new Set(selectedPeriodIndices.map((i) => OUTFIT_PERIODS[i]?.id).filter(Boolean))
    const matching = item.timePeriodIds
      .filter((id) => selectedIds.has(id))
      .map((id) => OUTFIT_PERIODS.find((p) => p.id === id)?.label ?? id)
    if (matching.length > 0) return `(${matching.join(', ')})`
  }
  return item.condition ?? '기온/체감/바람 변화 시 추가 착용'
}

export type OutfitPeriodWeather =
  | {
      source: 'period_hourly'
      conditionLabel: string
      minTemp: number
      maxTemp: number
      periodName: string
      /** 다중 시간대 선택 시 가장 추운 시간대 레이블 (조건부 아이템 표시용) */
      coldPeriodLabel?: string
    }
  | {
      source: 'day_daily'
      conditionLabel: string
      minTemp: number
      maxTemp: number
    }

interface Props {
  result: OutfitResultType
  schedule?: { startHour: number; endHour: number; durationHour: number }
  periodWeather?: OutfitPeriodWeather | null
  /** 기본: 「오늘의 복장 추천」— 모바일 등에서 「복장 추천」으로 변경 */
  resultTitle?: string
  gender?: GenderType
  /** KST 달력 월 1–12. 히어로 `fall-layered` 문구용 */
  calendarMonth?: number
  /** 맑음(맑음·무강수)일 때 일러스트에 햇빛 레이어 표시 */
  showSunshine?: boolean
  /** 상단 하늘 밴드 라인 아이콘(하늘·강수형태) */
  weatherSky?: OutfitWeatherSnapshot
  /** 모바일 등 제목행 우측 액션(예: 세부 옵션 버튼) */
  headerEnd?: ReactNode
  /** 선택된 OUTFIT_PERIOD 인덱스 배열 — 시간 조건부 아이템 레이블 필터용 */
  selectedOutfitPeriodIndices?: number[]
  /** 선택 시간대가 밤이면 일러스트 배경의 해→달 전환 */
  isNight?: boolean
}

const LAYER_BAR_COLORS = ['#22C55E', '#FFB547', '#EF4444']

type TabId = 'illust' | 'list'

export function OutfitResult({
  result,
  schedule,
  periodWeather,
  resultTitle = '오늘의 복장 추천',
  gender = 'male',
  calendarMonth,
  showSunshine,
  weatherSky,
  headerEnd,
  selectedOutfitPeriodIndices,
  isNight,
}: Props) {
  const [tab, setTab] = useState<TabId>('illust')

  const activityItems = result.items.filter((i) => i.activityTag)
  const requiredItems = result.items.filter((i) => i.required && !i.activityTag)
  const optionalItems = result.items.filter((i) => !i.required && !i.activityTag)
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`
  const optionalGuideLines = optionalItems.map((item) => {
    const cond = resolveItemConditionText(item, selectedOutfitPeriodIndices)
    return cond.startsWith('(') ? `${item.name} ${cond}` : `${item.name}: ${cond}`
  })

  return (
    <div className="space-y-4">
      {/* Danger Banner */}
      {result.dangerReasons.length > 0 && (
        <DangerBanner
          level={result.dangerLevel}
          reasons={result.dangerReasons}
          cancelActivity={result.cancelActivity}
        />
      )}

      {/* Header: title + layer info (no illustration here) */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold flex-1 min-w-0" style={{ color: 'var(--primary)' }}>
            {result.cancelActivity ? '⚠️ 활동 재검토 권고' : resultTitle}
          </h2>
          {headerEnd ? <div className="shrink-0 pt-0.5">{headerEnd}</div> : null}
        </div>
        {schedule && optionalItems.length > 0 && (
          <div className="text-[13px] sm:text-xs mt-1" style={{ color: 'var(--muted)' }}>
            <p>선택 아이템 착용 가이드 ({hh(schedule.startHour)} ~ {hh(schedule.endHour)}):</p>
            {optionalGuideLines.map((line) => (
              <p key={line} className="pl-2">- {line}</p>
            ))}
          </div>
        )}
        <div className="flex items-start justify-between gap-2 mt-1">
          <div className="flex flex-col gap-0.5">
            <span
              className="text-[11px] font-medium leading-tight"
              style={{ color: 'var(--accent)' }}
            >
              {result.layerLabel}
            </span>
            {/* Layer level bar */}
            <div className="flex gap-1">
              {[1, 2, 3].map((l) => (
                <div
                  key={l}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: l <= result.layerLevel ? LAYER_BAR_COLORS[result.layerLevel - 1] : 'var(--border)',
                  }}
                />
              ))}
            </div>
          </div>
          {periodWeather && (
            <p className="text-[9px] font-semibold tabular-nums text-right leading-snug" style={{ color: 'var(--muted)' }}>
              {periodWeather.source === 'period_hourly' && periodWeather.periodName
                ? `${periodWeather.periodName} · `
                : '해당일 · '}
              {periodWeather.conditionLabel} · 최고 {formatTemp1(periodWeather.maxTemp)}° / 최저 {formatTemp1(periodWeather.minTemp)}°
            </p>
          )}
        </div>
      </div>

      {/* 오존 피크 시간대 경고 */}
      {result.ozoneTimeWarning && (
        <div
          className="flex gap-2.5 rounded-xl p-3"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.30)' }}
        >
          <span className="text-base flex-shrink-0 mt-0.5">⚗️</span>
          <div className="min-w-0">
            {result.ozoneTimeWarning.split('\n').map((line, i) => (
              <p
                key={i}
                className={i === 0 ? 'text-xs font-bold leading-snug' : 'text-xs leading-relaxed mt-1'}
                style={{ color: i === 0 ? '#92400E' : 'var(--text)' }}
              >
                {i === 0 ? line.replace('⚗️ ', '') : line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Microclimate note */}
      {result.microclimateNote && (
        <div
          className="flex gap-2 rounded-xl p-3"
          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: '#0369A1' }}>
            {result.microclimateNote}
          </p>
        </div>
      )}

      {/* Alert badges */}
      {(result.uvAlert || result.dustAlert || result.rainAlert || result.windAlert) && (
        <div className="flex flex-wrap gap-2">
          {result.uvAlert && <AlertBadge icon="☀️" label="자외선 주의" color="#F59E0B" />}
          {result.dustAlert && <AlertBadge icon="😷" label="미세먼지 주의" color="#64748B" />}
          {result.rainAlert && <AlertBadge icon="🌧" label="우천 대비" color="#5B8DEE" />}
          {result.windAlert && <AlertBadge icon="💨" label="강풍 주의" color="#7EC8C8" />}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex rounded-xl overflow-hidden"
        role="tablist"
        style={{ border: '1px solid var(--border)' }}
      >
        {([['illust', '🧍 일러스트'], ['list', '📋 아이템 목록']] as [TabId, string][]).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === id ? 'var(--primary)' : 'var(--surface)',
              color: tab === id ? 'white' : 'var(--muted)',
              borderRight: id === 'illust' ? '1px solid var(--border)' : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panel: 일러스트 */}
      {tab === 'illust' && (
        <div role="tabpanel">
          <OutfitIllustPanel
            result={result}
            gender={gender}
            calendarMonth={calendarMonth}
            showSunshine={showSunshine}
            weatherSky={weatherSky}
            selectedOutfitPeriodIndices={selectedOutfitPeriodIndices}
            isNight={isNight}
          />
        </div>
      )}

      {/* Tab panel: 아이템 목록 */}
      {tab === 'list' && (
        <div role="tabpanel" className="space-y-4">
          <div
            className="rounded-xl p-2.5 sm:p-3"
            style={{ background: 'rgba(91,141,238,0.06)', border: '1px solid rgba(91,141,238,0.18)' }}
          >
            <p className="text-[13px] sm:text-xs font-semibold" style={{ color: 'var(--humidity)' }}>추천 기준 설명</p>
            <p className="text-[13px] sm:text-xs mt-1 leading-relaxed" style={{ color: 'var(--text)' }}>
              필수는 현재 기상 위험(강수·강풍·미세먼지·자외선)과 활동 시간 동안의 체온 유지/안전을 위해 꼭 필요한 항목입니다.
              선택은 편의·활동 특화·스타일 보완 항목입니다.
            </p>
          </div>

          <SectionList title={`필수 아이템 (${requiredItems.length})`} items={requiredItems} />
          <SectionList title={`선택 아이템 (${optionalItems.length})`} items={optionalItems} />
          <SectionList
            title={`활동·장소 전용 (${activityItems.length})`}
            subtitle="등산·골프·강변 등 선택한 활동에 붙는 준비 물품입니다."
            items={activityItems}
          />

          {/* Tips */}
          {result.tips.length > 0 && (
            <div
              className="rounded-xl p-2.5 sm:p-3 space-y-1.5"
              style={{ background: 'rgba(91,141,238,0.06)', border: '1px solid rgba(91,141,238,0.15)' }}
            >
              <p className="text-[13px] sm:text-xs font-semibold" style={{ color: 'var(--humidity)' }}>
                착장 팁
              </p>
              {result.tips.map((tip, i) => (
                <p key={i} className="text-sm" style={{ color: 'var(--text)' }}>
                  {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionList({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle?: string
  items: OutfitResultType['items']
}) {
  if (!items.length) return null
  return (
    <div>
      <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{title}</p>
      {subtitle ? (
        <p className="text-[10px] mt-0.5 mb-2 leading-relaxed" style={{ color: 'var(--muted)' }}>{subtitle}</p>
      ) : (
        <div className="mb-2" />
      )}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {items.map((item) => (
          <OutfitItemCard key={`${title}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  )
}

function AlertBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {icon} {label}
    </span>
  )
}

const DANGER_STYLES: Record<DangerLevel, { bg: string; border: string; titleColor: string; title: string }> = {
  none:    { bg: 'transparent', border: 'transparent', titleColor: '', title: '' },
  caution: { bg: 'rgba(14,165,233,0.07)', border: 'rgba(14,165,233,0.3)', titleColor: '#0369A1', title: '💡 주의 사항' },
  warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.35)', titleColor: '#92400E', title: '⚠️ 기상 경고' },
  cancel:  { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.35)', titleColor: '#B91C1C', title: '⛔ 활동 취소 권고' },
}

function DangerBanner({ level, reasons, cancelActivity }: {
  level: DangerLevel
  reasons: string[]
  cancelActivity: boolean
}) {
  if (level === 'none') return null
  const s = DANGER_STYLES[level]
  return (
    <div
      className="rounded-xl p-3 space-y-1.5"
      style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
    >
      <p className="text-sm font-bold" style={{ color: s.titleColor }}>
        {s.title}
      </p>
      {cancelActivity && (
        <p className="text-xs font-semibold" style={{ color: s.titleColor }}>
          현재 기상 조건에서 선택한 활동을 재검토하거나 취소를 권고합니다.
        </p>
      )}
      <div className="space-y-1 mt-1">
        {reasons.map((r, i) => (
          <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
            {r}
          </p>
        ))}
      </div>
    </div>
  )
}

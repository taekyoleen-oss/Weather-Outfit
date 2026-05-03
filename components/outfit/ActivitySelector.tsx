'use client'

import { useState } from 'react'
import type { ActivityType } from '@/types/outfit'
import { ACTIVITY_GUIDES } from '@/lib/outfit/activityGuides'
import type { ActivityGuideData, RiskGuide } from '@/lib/outfit/activityGuides'

interface Props {
  value: ActivityType
  onChange: (a: ActivityType) => void
  /** 복장·카드 기준일(KST yyyymmdd) */
  scheduleYmd: string
  scheduleYmdMin: string
  scheduleYmdMax: string
  onScheduleYmdChange: (ymd: string) => void
  startHour: number
  /** 시작 시각 `<select>`에 나올 최소 시(시간대 시작 또는 지금 구간일 때 현재 시+1, KST) */
  startHourMin: number
  endHour: number
  onStartHourChange: (hour: number) => void
  onEndHourChange: (hour: number) => void
  /** 모바일: 산책·달리기·골프 고정 + 나머지 콤보 */
  variant?: 'default' | 'mobileSimple'
  /** 모바일: 기준일·시작·종료는 상위에서만 표시 */
  hideScheduleFields?: boolean
}

function ymdToDateInput(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

function dateInputToYmd(iso: string): string {
  return iso.replace(/-/g, '')
}

function formatYmdKorean(ymd: string): string {
  if (ymd.length < 8) return ymd
  return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`
}

const ACTIVITIES: { id: ActivityType; label: string; icon: string }[] = [
  { id: 'urban_walk', label: '산책', icon: '🏙️' },
  { id: 'picnic', label: '소풍', icon: '🧺' },
  { id: 'river', label: '강변', icon: '🌊' },
  { id: 'beach', label: '해변', icon: '🏖️' },
  { id: 'running', label: '달리기', icon: '🏃' },
  { id: 'cycling', label: '자전거', icon: '🚴' },
  { id: 'hiking', label: '등산', icon: '🏔️' },
  { id: 'golf', label: '골프', icon: '⛳' },
]

const MOBILE_PRIMARY_IDS: ActivityType[] = ['urban_walk', 'running', 'golf']

const RISK_COLORS: Record<RiskGuide['level'], { bg: string; text: string; border: string; badge: string }> = {
  cancel:  { bg: 'rgba(239,68,68,0.06)',  text: '#B91C1C', border: 'rgba(239,68,68,0.25)',  badge: '#EF4444' },
  warning: { bg: 'rgba(245,158,11,0.06)', text: '#92400E', border: 'rgba(245,158,11,0.25)', badge: '#F59E0B' },
  caution: { bg: 'rgba(14,165,233,0.06)', text: '#0369A1', border: 'rgba(14,165,233,0.25)', badge: '#0EA5E9' },
}

const RISK_LABELS: Record<RiskGuide['level'], string> = {
  cancel:  '⛔ 활동 취소',
  warning: '⚠️ 경고',
  caution: '💡 주의',
}

const SEASON_ICONS: Record<string, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
}

const SEASON_LABELS: Record<string, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
}

function ActivityGuideModal({ guide, onClose }: { guide: ActivityGuideData; onClose: () => void }) {
  const [tab, setTab] = useState<'season' | 'risk' | 'checklist'>('season')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md max-h-[85dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{guide.icon}</span>
              <h3 className="text-base font-bold" style={{ color: 'var(--primary)' }}>{guide.label}</h3>
            </div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
              {guide.description}
            </p>
            <p className="text-[10px] mt-2 leading-relaxed rounded-lg px-2 py-1.5" style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              이 가이드는 앱 추천과 같은 기준을 따릅니다. 체감 <strong style={{ color: 'var(--text)' }}>28·23·18·12·6℃</strong> 구간,
              {' '}<strong style={{ color: 'var(--text)' }}>UV 6↑</strong> 시 긴팔·팔토시·챙 넓은 모자,
              {' '}<strong style={{ color: 'var(--text)' }}>풍속 5m/s↑</strong> 방풍·모자 고정,
              {' '}<strong style={{ color: 'var(--text)' }}>14m/s↑</strong> 강풍주의보,
              {' '}미세먼지·오존·<strong style={{ color: 'var(--text)' }}>고습(70%↑·25℃↑)</strong> 보정을 반영했습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1.5 rounded-full text-lg leading-none flex-shrink-0"
            style={{ color: 'var(--muted)', background: 'var(--surface)' }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2">
          {(['season', 'risk', 'checklist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t ? 'var(--primary)' : 'var(--surface)',
                color: tab === t ? '#fff' : 'var(--muted)',
              }}
            >
              {t === 'season' ? '계절별 복장' : t === 'risk' ? '날씨 위험 기준' : '체크리스트'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {tab === 'season' && (
            <div className="space-y-3 pt-1">
              {(Object.entries(guide.seasons) as [string, typeof guide.seasons.spring][]).map(([season, sg]) => (
                <div
                  key={season}
                  className="rounded-xl p-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                    {SEASON_ICONS[season]} {SEASON_LABELS[season]} — {sg.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sg.items.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(14,165,233,0.10)', color: 'var(--primary)' }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  {sg.note && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                      💡 {sg.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'risk' && (
            <div className="space-y-2.5 pt-1">
              {guide.risks.map((risk, i) => {
                const c = RISK_COLORS[risk.level]
                return (
                  <div
                    key={i}
                    className="rounded-xl p-3"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: c.badge, color: '#fff' }}
                      >
                        {RISK_LABELS[risk.level]}
                      </span>
                      <p className="text-xs font-semibold" style={{ color: c.text }}>
                        {risk.condition}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed mb-1.5" style={{ color: 'var(--text)' }}>
                      {risk.action}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      📋 근거: {risk.source}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'checklist' && (
            <div className="pt-1">
              <div
                className="rounded-xl p-3 space-y-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                  외출 전 확인사항
                </p>
                {guide.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }}>✓</span>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{item}</p>
                  </div>
                ))}
              </div>

              {/* Key risks summary */}
              <div className="mt-3">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>주요 위험 요소</p>
                <div className="flex flex-wrap gap-1.5">
                  {guide.keyRisks.map((r, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#B91C1C', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
                📋 {guide.sourceNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ActivitySelector({
  value,
  onChange,
  scheduleYmd,
  scheduleYmdMin,
  scheduleYmdMax,
  onScheduleYmdChange,
  startHour,
  startHourMin,
  endHour,
  onStartHourChange,
  onEndHourChange,
  variant = 'default',
  hideScheduleFields = false,
}: Props) {
  const [guideActivity, setGuideActivity] = useState<ActivityType | null>(null)
  const guideData = guideActivity ? ACTIVITY_GUIDES[guideActivity] : null
  const minH = Math.min(23, Math.max(0, Math.floor(startHourMin)))
  const hourOptions = Array.from({ length: 24 - minH }, (_, i) => minH + i)
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

  const mobileExtras = ACTIVITIES.filter((a) => !MOBILE_PRIMARY_IDS.includes(a.id))

  if (variant === 'mobileSimple') {
    return (
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          활동
        </p>
        <div className="flex gap-1.5 items-stretch">
          {MOBILE_PRIMARY_IDS.map((id) => {
            const a = ACTIVITIES.find((x) => x.id === id)!
            const selected = value === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className="min-w-0 flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-lg text-center transition-all"
                style={{
                  background: selected ? 'var(--primary-tint-12)' : 'var(--surface)',
                  border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                <span className="text-lg leading-none">{a.icon}</span>
                <span
                  className="font-medium leading-tight text-[11px] break-keep"
                  style={{ color: selected ? 'var(--primary)' : 'var(--muted)' }}
                >
                  {a.label}
                </span>
              </button>
            )
          })}
          <label className="flex min-w-[92px] max-w-[38%] flex-[1.1] flex-col justify-end gap-0.5">
            <span className="text-[10px] font-semibold leading-tight" style={{ color: 'var(--muted)' }}>
              그 외 활동
            </span>
            <select
              value={MOBILE_PRIMARY_IDS.includes(value) ? '' : value}
              onChange={(e) => {
                const v = e.target.value as ActivityType
                if (v) onChange(v)
              }}
              className="w-full min-w-0 text-[10px] sm:text-[11px] rounded-lg px-1.5 py-1.5 outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              aria-label="그 외 활동 선택"
            >
              <option value="">선택…</option>
              {mobileExtras.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!hideScheduleFields && (
          <div className="mt-3 space-y-2">
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                기준일 (KST)
              </span>
              <input
                type="date"
                className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                value={ymdToDateInput(scheduleYmd)}
                min={ymdToDateInput(scheduleYmdMin)}
                max={ymdToDateInput(scheduleYmdMax)}
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) return
                  onScheduleYmdChange(dateInputToYmd(v))
                }}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>시작</span>
                <select
                  value={String(startHour)}
                  onChange={(e) => onStartHourChange(Number(e.target.value))}
                  className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {hourOptions.map((h) => (
                    <option key={`start-${h}`} value={String(h)}>{hh(h)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>종료</span>
                <select
                  value={String(endHour)}
                  onChange={(e) => onEndHourChange(Number(e.target.value))}
                  className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {hourOptions.map((h) => (
                    <option key={`end-${h}`} value={String(h)}>{hh(h)}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {guideData && (
          <ActivityGuideModal guide={guideData} onClose={() => setGuideActivity(null)} />
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>
        활동 선택
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {ACTIVITIES.map((a) => {
          const selected = value === a.id
          return (
            <div key={a.id} className="relative">
              <button
                onClick={() => onChange(a.id)}
                className="w-full flex flex-col items-center gap-1 p-1.5 rounded-xl text-center transition-all"
                style={{
                  background: selected ? 'rgba(255,181,71,0.15)' : 'var(--surface)',
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                }}
                aria-pressed={selected}
                aria-label={a.label}
              >
                <span className="text-xl">{a.icon}</span>
                <span
                  className="font-medium leading-tight text-center break-keep"
                  style={{ color: selected ? 'var(--accent)' : 'var(--muted)', fontSize: '11.5px' }}
                >
                  {a.label}
                </span>
              </button>
              {/* Info button — 더 은은한 톤으로 최소 노출 */}
              <button
                onClick={(e) => { e.stopPropagation(); setGuideActivity(a.id) }}
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-semibold z-10 transition-colors"
                style={{
                  background: 'rgba(148, 163, 184, 0.20)',
                  color: 'rgba(100, 116, 139, 0.72)',
                  border: '1px solid rgba(148, 163, 184, 0.22)',
                  boxShadow: 'none',
                }}
                aria-label={`${a.label} 복장 가이드: 체감 구간·UV·바람·대기질 기준 (앱 추천과 동기화)`}
                title={`${a.label} 복장 가이드 — 체감 28/23/18/12/6℃, UV6↑, 풍 5m/s·14m/s, 미세먼지·오존·고습 반영`}
              >
                ?
              </button>
            </div>
          )
        })}
      </div>

      {!hideScheduleFields && (
      <div className="mt-3 space-y-2">
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
            기준일 (KST)
          </span>
          <input
            type="date"
            className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={ymdToDateInput(scheduleYmd)}
            min={ymdToDateInput(scheduleYmdMin)}
            max={ymdToDateInput(scheduleYmdMax)}
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              onScheduleYmdChange(dateInputToYmd(v))
            }}
            aria-label="복장·날씨 기준일"
          />
        </label>
        <p className="text-[10px] leading-snug" style={{ color: 'var(--muted)' }}>
          {formatYmdKorean(scheduleYmd)} · {hh(startHour)}–{hh(endHour)} (시간대 칩과 동기화되며, 여기서 바꿀 수 있어요)
        </p>
        <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>시작 시간</span>
          <select
            value={String(startHour)}
            onChange={(e) => onStartHourChange(Number(e.target.value))}
            className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            aria-label="운동 시작 시간"
          >
            {hourOptions.map((h) => (
              <option key={`start-${h}`} value={String(h)}>{hh(h)}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>종료 시간</span>
          <select
            value={String(endHour)}
            onChange={(e) => onEndHourChange(Number(e.target.value))}
            className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            aria-label="운동 종료 시간"
          >
            {hourOptions.map((h) => (
              <option key={`end-${h}`} value={String(h)}>{hh(h)}</option>
            ))}
          </select>
        </label>
        </div>
      </div>
      )}

      {/* Guide Modal */}
      {guideData && (
        <ActivityGuideModal
          guide={guideData}
          onClose={() => setGuideActivity(null)}
        />
      )}
    </div>
  )
}

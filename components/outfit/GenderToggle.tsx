'use client'

import { useState } from 'react'
import type { GenderType } from '@/types/outfit'

interface Props {
  value: GenderType
  onChange: (g: GenderType) => void
}

// ─── 가이드 데이터 ────────────────────────────────────────────────────────────
// 근거: weather-outdoor-clothing-guide.md 마. 남녀별 추천 방식

interface ConditionRow {
  condition: string
  items: string[]
  note?: string
}

interface GenderGuideData {
  icon: string
  label: string
  principle: string
  conditions: ConditionRow[]
  sensitiveNote: string
  sourceNote: string
}

const GENDER_GUIDES: Record<GenderType, GenderGuideData> = {
  male: {
    icon: '👨',
    label: '남성 복장 추천 가이드',
    principle:
      '자외선·미세먼지·오존·폭염·한파의 안전 기준은 성별 관계없이 동일하게 적용합니다. ' +
      '남성은 카라티·슬림 팬츠·기능성 스포츠웨어 중심으로 제안하며, ' +
      '보호 장비(마스크·선크림·모자 등)는 여성과 동일하게 필수입니다.',
    conditions: [
      {
        condition: '더운 날 · 자외선 높음 (UV 6 이상)',
        items: [
          '밝은색 기능성 반팔 또는 얇은 긴팔 카라티',
          '통기성 팬츠 (린넨·쿨링 소재)',
          '챙 넓은 모자 (볼캡·버킷햇)',
          'UV 차단 선글라스',
          'SPF50+ 자외선 차단제',
        ],
        note: 'CDC: 극심한 더위에서는 헐렁하고 밝은색 옷을 권고합니다. UV 6 이상 시 긴팔 또는 팔토시를 추가하세요.',
      },
      {
        condition: '미세먼지 나쁨 (PM10 81㎍/㎥ 이상)',
        items: [
          'KF80 이상 보건용 마스크',
          '먼지가 덜 붙는 매끈한 소재 외투',
          '귀가 후 세탁하기 쉬운 상의',
        ],
        note: '에어코리아: 조깅·등산·자전거처럼 호흡량이 많은 운동을 줄이세요.',
      },
      {
        condition: '강변 산책 · 바람 (풍속 5m/s 이상)',
        items: [
          '방풍 바람막이',
          '얇은 긴바지',
          '고정력 있는 캡 또는 버킷햇',
          '미끄럼 적은 운동화',
        ],
        note: '강변은 체감온도가 도심보다 2~3°C 낮습니다.',
      },
      {
        condition: '등산',
        items: [
          '흡습속건 베이스레이어',
          '플리스 또는 경량 패딩 (미드레이어)',
          '방풍·방수 재킷 (쉘)',
          '등산화',
          '모자 · 장갑 (계절에 따라)',
        ],
        note: '정상부는 3~5°C 낮고 바람이 강합니다. 배낭에 여분 레이어를 항상 챙기세요.',
      },
      {
        condition: '골프',
        items: [
          'UV 차단 긴팔 이너 또는 팔토시',
          '카라티 (기능성 소재)',
          '통기성 팬츠',
          '선글라스',
          '챙 넓은 골프 모자',
          '우천 시 레인재킷',
        ],
        note: '기상청: 낙뢰 예상 시 골프채를 즉시 내려놓고 안전한 건물·차량으로 대피하세요.',
      },
      {
        condition: '추운 날 (체감 5°C 이하)',
        items: [
          '기모 긴팔 / 상하 내복',
          '두꺼운 니트 또는 플리스',
          '패딩 점퍼 또는 울 코트',
          '목도리',
          '방한 장갑',
          '방한화',
        ],
        note: '기상청 한파 행동요령: 바람이 강할수록 노출 피부 열손실이 커집니다. 귀마개·비니를 추가하세요.',
      },
    ],
    sensitiveNote:
      '민감군(노인·심폐질환자)은 같은 미세먼지·오존 농도에서도 더 보수적인 활동 조정이 필요합니다. ' +
      '피부가 햇볕에 민감하면 SPF30 이상 광범위 자외선 차단제와 UPF 의류를 함께 사용하세요.',
    sourceNote:
      '기상청 생활기상지수 · 에어코리아 미세먼지·오존 행동요령 · CDC Extreme Heat · 미국 피부과학회(AAD)',
  },

  female: {
    icon: '👩',
    label: '여성 복장 추천 가이드',
    principle:
      '자외선·미세먼지·오존·폭염·한파의 안전 기준은 성별 관계없이 동일하게 적용합니다. ' +
      '여성은 UV 가디건·레깅스·큐롤·와이드 팬츠 등 다양한 선택지를 제안하며, ' +
      '보호 장비(마스크·선크림·모자 등)는 남성과 동일하게 필수입니다.',
    conditions: [
      {
        condition: '더운 날 · 자외선 높음 (UV 6 이상)',
        items: [
          'UV 차단 가디건 또는 얇은 긴팔 래시가드형 상의',
          '통기성 팬츠·레깅스 또는 큐롤',
          '챙 넓은 모자 (버킷햇·밀짚모자)',
          'UV 차단 선글라스',
          'SPF50+ 자외선 차단제',
        ],
        note: '기상청: UV 6 이상에서 긴 소매 옷이 권고됩니다. 롱스커트보다 활동용 팬츠 또는 레깅스가 움직임에 유리합니다.',
      },
      {
        condition: '미세먼지 나쁨 (PM10 81㎍/㎥ 이상)',
        items: [
          'KF80 이상 보건용 마스크',
          '세탁하기 쉬운 외투',
          '먼지가 덜 붙는 매끈한 소재',
          '렌즈 착용자 → 안경 전환 고려',
        ],
        note: '에어코리아: 민감군은 실외활동량을 줄이고 귀가 후 즉시 세안·세척을 권장합니다.',
      },
      {
        condition: '강변 산책 · 바람 (풍속 5m/s 이상)',
        items: [
          '방풍 바람막이',
          '활동용 긴바지 또는 레깅스 (치마 대신)',
          '날리지 않는 모자 (버킷햇·턱끈 있는 것)',
          '미끄럼 적은 운동화',
        ],
        note: '바람이 강한 날 치마·원피스는 불편하고 안전에도 좋지 않습니다.',
      },
      {
        condition: '등산',
        items: [
          '흡습속건 상의',
          '보온 미드레이어 (플리스·경량 패딩)',
          '방풍·방수 재킷',
          '활동용 팬츠 또는 레깅스 (등산 전용)',
          '등산화',
          '모자 · 장갑 (계절에 따라)',
        ],
        note: '등산 레깅스 착용 시 방풍 팬츠를 겉에 덧입으면 정상부 바람을 효과적으로 막을 수 있습니다.',
      },
      {
        condition: '골프',
        items: [
          'UV 차단 긴팔 이너',
          '냉감 소재 상의',
          '큐롤 또는 스커트·팬츠 (기능성)',
          '선글라스',
          '챙 넓은 골프 모자',
          '우천 시 레인웨어 (상하의)',
        ],
        note: '기상청: 낙뢰 예상 시 즉시 클럽하우스·차량으로 대피하세요. 우산보다 비옷이 안전합니다.',
      },
      {
        condition: '추운 날 (체감 5°C 이하)',
        items: [
          '기모 긴팔 / 기모 레깅스 (내복)',
          '두꺼운 니트 또는 울 가디건',
          '롱코트 또는 패딩 점퍼',
          '머플러 또는 숄',
          '장갑',
          '방한 부츠 또는 앵클 부츠',
        ],
        note: '기상청 한파 행동요령: 목·손·발을 중점 보온하세요. 기모 레깅스는 하의 내복을 대체할 수 있습니다.',
      },
    ],
    sensitiveNote:
      '민감군(임산부·노인·피부민감자)은 같은 자외선·미세먼지 농도에서도 더 보수적인 대응이 필요합니다. ' +
      '콘택트렌즈 착용자는 미세먼지 나쁨 시 안경 전환을 고려하세요. ' +
      'SPF30 이상 광범위 자외선 차단제와 UPF 의류를 함께 사용하면 효과가 높아집니다.',
    sourceNote:
      '기상청 생활기상지수 · 에어코리아 미세먼지·오존 행동요령 · CDC Extreme Heat · 미국 피부과학회(AAD)',
  },
}

// ─── 모달 ────────────────────────────────────────────────────────────────────

function GenderGuideModal({ gender, onClose }: { gender: GenderType; onClose: () => void }) {
  const guide = GENDER_GUIDES[gender]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

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
              {guide.principle}
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {guide.conditions.map((row, i) => (
            <div
              key={i}
              className="rounded-xl p-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Condition title */}
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                🔹 {row.condition}
              </p>

              {/* Item chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {row.items.map((item, j) => (
                  <span
                    key={j}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(14,165,233,0.10)', color: 'var(--primary)' }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Note */}
              {row.note && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  💡 {row.note}
                </p>
              )}
            </div>
          ))}

          {/* Sensitive group note */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>
              ⚠️ 민감군·취약자 추가 안내
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
              {guide.sensitiveNote}
            </p>
          </div>

          {/* Source */}
          <p className="text-[10px] pb-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
            📋 근거: {guide.sourceNote}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function GenderToggle({ value, onChange }: Props) {
  const [guideGender, setGuideGender] = useState<GenderType | null>(null)

  return (
    <>
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          성별
        </p>
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)' }}
          role="group"
          aria-label="성별 선택"
        >
          {([
            { id: 'male' as GenderType, label: '남성', icon: '👨' },
            { id: 'female' as GenderType, label: '여성', icon: '👩' },
          ] as const).map((g) => {
            const selected = value === g.id
            return (
              <div key={g.id} className="relative">
                <button
                  onClick={() => onChange(g.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: selected ? '#0EA5E9' : 'transparent',
                    color: selected ? '#ffffff' : 'var(--muted)',
                    boxShadow: selected ? '0 2px 10px rgba(14,165,233,0.35)' : 'none',
                    fontWeight: selected ? 700 : 500,
                  }}
                  aria-pressed={selected}
                >
                  <span>{g.icon}</span>
                  {g.label}
                </button>
                {/* Info button — 연한 회색으로 표시 */}
                <button
                  onClick={(e) => { e.stopPropagation(); setGuideGender(g.id) }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold z-10 transition-colors"
                  style={{
                    background: 'rgba(148, 163, 184, 0.75)',
                    color: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  }}
                  aria-label={`${g.label} 복장 가이드 보기`}
                  title={`${g.label} 복장 가이드`}
                >
                  ℹ
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Guide Modal */}
      {guideGender && (
        <GenderGuideModal
          gender={guideGender}
          onClose={() => setGuideGender(null)}
        />
      )}
    </>
  )
}

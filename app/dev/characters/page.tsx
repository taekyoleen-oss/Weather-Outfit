/**
 * 임시 캐릭터 프리뷰 페이지 — 캐논 + 베이스 + 상황 + v2 전체를 한눈에 비교.
 * /dev/characters 로 접근. 검수 끝나면 삭제 가능.
 */
import Image from 'next/image'

type Slot = { key: string; gender: 'male' | 'female'; group: string; canon?: boolean; v2?: boolean }

const SLOTS: Slot[] = [
  // 캐논
  { key: 'cool',     gender: 'male',   group: '캐논 (Reference)', canon: true },
  { key: 'warm',     gender: 'female', group: '캐논 (Reference)', canon: true },
  // 남자 베이스
  { key: 'freezing', gender: 'male', group: '남자 베이스 — 온도 슬롯' },
  { key: 'cold',     gender: 'male', group: '남자 베이스 — 온도 슬롯' },
  { key: 'cool',     gender: 'male', group: '남자 베이스 — 온도 슬롯' },
  { key: 'mild',     gender: 'male', group: '남자 베이스 — 온도 슬롯' },
  { key: 'warm',     gender: 'male', group: '남자 베이스 — 온도 슬롯' },
  { key: 'hot',      gender: 'male', group: '남자 베이스 — 온도 슬롯' },
  // 여자 베이스
  { key: 'freezing', gender: 'female', group: '여자 베이스 — 온도 슬롯' },
  { key: 'cold',     gender: 'female', group: '여자 베이스 — 온도 슬롯' },
  { key: 'cool',     gender: 'female', group: '여자 베이스 — 온도 슬롯' },
  { key: 'mild',     gender: 'female', group: '여자 베이스 — 온도 슬롯' },
  { key: 'warm',     gender: 'female', group: '여자 베이스 — 온도 슬롯' },
  { key: 'hot',      gender: 'female', group: '여자 베이스 — 온도 슬롯' },
  // 상황 슬롯
  { key: 'rain-light', gender: 'male',   group: '상황 슬롯 — 날씨 트리거' },
  { key: 'rain-light', gender: 'female', group: '상황 슬롯 — 날씨 트리거' },
  { key: 'rain-heavy', gender: 'male',   group: '상황 슬롯 — 날씨 트리거' },
  { key: 'rain-heavy', gender: 'female', group: '상황 슬롯 — 날씨 트리거' },
  { key: 'snow',       gender: 'male',   group: '상황 슬롯 — 날씨 트리거' },
  { key: 'snow',       gender: 'female', group: '상황 슬롯 — 날씨 트리거' },
  { key: 'sunny-uv',   gender: 'male',   group: '상황 슬롯 — 날씨 트리거' },
  { key: 'sunny-uv',   gender: 'female', group: '상황 슬롯 — 날씨 트리거' },
  { key: 'windy',      gender: 'male',   group: '상황 슬롯 — 날씨 트리거' },
  { key: 'windy',      gender: 'female', group: '상황 슬롯 — 날씨 트리거' },
  // 여성 v2
  { key: 'warm', gender: 'female', group: '여성 라이프스타일 v2', v2: true },
  { key: 'cool', gender: 'female', group: '여성 라이프스타일 v2', v2: true },
  { key: 'mild', gender: 'female', group: '여성 라이프스타일 v2', v2: true },
]

function srcFor(s: Slot): string {
  const v = s.v2 ? 'v2' : 'v1'
  return `/outfit/characters/${s.gender}-${s.key}-${v}.webp`
}
function labelFor(s: Slot): string {
  const base = `${s.gender}-${s.key}-${s.v2 ? 'v2' : 'v1'}`
  return s.canon ? `${base} ★ CANON` : base
}

const GROUPS = Array.from(new Set(SLOTS.map((s) => s.group)))

export default function CharactersPreview() {
  return (
    <main style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>캐릭터 일러스트 프리뷰</h1>
      <p style={{ color: '#64748B', marginBottom: 32 }}>
        2026-05-12 캐논 잠금 + Gemini Nano Banana 일괄 재생성 결과. 총 25슬롯(캐논 2 + 베이스 10 + 상황 10 + v2 3).
      </p>

      {GROUPS.map((group) => {
        const items = SLOTS.filter((s) => s.group === group)
        return (
          <section key={group} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, padding: '6px 12px', background: '#F1F5F9', borderLeft: '4px solid #0891B2', display: 'inline-block' }}>
              {group} ({items.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {items.map((s, idx) => (
                <figure key={`${group}-${idx}`} style={{ margin: 0, background: s.canon ? '#FEF3C7' : '#FFFFFF', border: `1px solid ${s.canon ? '#F59E0B' : '#E2E8F0'}`, borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3', background: '#F8FAFC', borderRadius: 8, overflow: 'hidden' }}>
                    <Image src={srcFor(s)} alt={labelFor(s)} fill style={{ objectFit: 'contain' }} sizes="180px" priority={s.canon} />
                  </div>
                  <figcaption style={{ marginTop: 8, fontSize: 12, color: '#475569', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
                    {labelFor(s)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}

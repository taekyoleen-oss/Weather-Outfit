# 동적 복장 일러스트 — 체크박스 연동 계획

## Context

**해결할 문제**

사용자가 "오늘의 복장 추천" 카드를 보면서 두 가지 한계를 지적했습니다.

1. 히어로 일러스트(상단 우측 120px 캐릭터 이미지)가 `pickHeroIllust(zone, activity, ptyCode)`로 선택되는 **10종 정적 SVG 중 하나**라, 추천 결과에 따라 패딩이 코트로 바뀌어도 그림은 똑같습니다. 추천이 바뀌어도 시각적 피드백이 없어 "내가 추천받은 옷"이 한눈에 안 들어옵니다.
2. 각 아이템 카드 앞 체크박스(`OutfitItemCard.tsx:11`의 `useState(false)`)는 클릭 시 카드만 회색 처리될 뿐 **다른 어디에도 연결되어 있지 않습니다**. 단순한 "준비물 챙겼나" 시각 표시일 뿐, 추천이나 일러스트와 무관합니다.

**의도하는 결과**

체크박스를 "이 옷을 실제로 입겠다"는 의미로 재정의하고, 체크된 아이템만 일러스트에 반영합니다. 추천 직후에는 모든 아이템이 체크된 상태(= 추천대로 입은 모습)로 시작하고, 사용자가 "패딩 말고 코트만 입을래" 처럼 일부 항목을 체크 해제하면 일러스트에서 해당 옷이 즉시 사라집니다. 결과적으로:

- 추천이 바뀌면 일러스트 구성도 바뀌어 시각적 차별화가 생긴다.
- 사용자가 자신만의 코디를 시뮬레이션해볼 수 있다.
- 체크박스에 명확한 기능적 의미가 부여된다.

**사용자가 선택한 방향** (사전 합의됨)

- 동작: **체크박스가 일러스트를 직접 제어** (체크된 것만 입음)
- 자산: **기존 SVG에서 부위별 path 추출 → 인라인 컴포넌트화**

---

## 설계 개요

### 1. 상태 끌어올리기 (state lifting)

현재 `OutfitItemCard` 내부의 `checked` 로컬 상태를 부모인 `OutfitResult`로 끌어올립니다.

- `OutfitResult`가 `Record<string, boolean>` (key = `item.id`) 형태의 `wearing` 맵을 보관.
- 초기값: 추천된 모든 아이템 ID에 대해 `true` (= 추천대로 다 입은 상태).
- `result` prop이 바뀌면 (다른 시각·다른 활동으로 재추천) 맵을 새 추천 ID 집합으로 리셋. `useEffect` 또는 `useMemo + key` 패턴으로 처리.
- `OutfitItemCard`는 `checked: boolean`과 `onToggle: () => void` 두 prop을 받아 controlled 컴포넌트가 됨.

### 2. 일러스트 컴포넌트 분기

`OutfitHeroIllustration.tsx`는 새 prop `wearingItems?: OutfitItem[]`를 받습니다.

- `wearingItems`가 주어지면 → 새 `DynamicOutfitIllustration` 렌더 (동적 인라인 SVG).
- 주어지지 않으면 → 기존 `<Image src="/illust/outfit/{key}.svg">` 렌더 (하위 호환·페일세이프).

라벨(`heroLabel(...)`)과 둥근 카드 컨테이너는 그대로 유지.

### 3. 인라인 SVG 레이어 구조

신규 컴포넌트 `DynamicOutfitIllustration`을 만들고, 그 안에서 다음 z-order로 SVG `<g>` 그룹을 합성합니다 (뒤 → 앞):

```
1. scene       — illustKey 기반 배경 (해/눈송이/낙엽/파도 등)
2. body        — 머리·목·팔·다리 (항상 표시, 하의·상의 뒤에 깔림)
3. base        — 이너 (목·소매 끝 살짝 보이는 정도)
4. bottom      — 하의 (팬츠/스커트/반바지/스키팬츠)
5. top         — 상의 (티/긴팔/니트/폴로/래시가드)
6. mid         — 미들레이어 (가디건/후드/플리스/베스트)
7. outer       — 아우터 (점퍼/코트/패딩/스키재킷/바람막이)
8. foot        — 신발
9. acc         — 액세서리 (모자·목도리·장갑·선글라스·팔토시)
10. rain       — 우산
11. mask       — 마스크
```

각 레이어는 작은 React 함수형 컴포넌트로 분리하고, 레이어 내부에서 **변형(variant)** 을 분기합니다. 변형은 `lib/outfit/rules.ts`의 아이템 ID로 결정됩니다.

### 4. 아이템 ID → 변형 매핑

신규 파일 `components/outfit/illustration/itemLayerMap.ts`에 명시적 매핑 테이블을 둡니다:

```ts
// 카테고리별로 아이템 ID를 시각 변형으로 정규화
export const TOP_VARIANT: Record<string, 'tshirt' | 'longsleeve' | 'knit' | 'shirt' | 'polo' | 'rashguard'> = {
  'top-tshirt':       'tshirt',
  'top-blouse':       'tshirt',
  'top-longsleeve':   'longsleeve',
  'top-longsleeve-f': 'longsleeve',
  'top-knit':         'knit',
  'top-shirt':        'shirt',
  'top-swimsuit':     'rashguard',
  'acc-rashguard':    'rashguard',
  // ...
}
// outer / mid / bottom / foot / acc도 동일한 패턴
```

각 카테고리는 다음과 같은 시각 변형을 갖습니다 (모두 `lib/outfit/rules.ts`에 실제 등장하는 ID 기준으로 도출):

- **top**: tshirt, longsleeve, knit, shirt, polo (golf), rashguard (beach), ski-inner
- **mid**: cardigan, hoodie, sweater, fleece, vest (golf-windvest)
- **outer**: windbreaker, jacket, trench, coat, padding, ski-jacket, raincoat (mc-river-windbreaker, mc-hiking-windbreaker 포함)
- **bottom**: shorts, pants, skirt-mini, midi-skirt, slacks, warm-pants, ski-pants, dress
- **foot**: sneaker, loafer, boots, hiking, sandal, golf, ski
- **acc** (multi-slot): hat (cap/sun/uvhat/beanie), scarf, gloves, sunglasses, armsleeve, helmet, goggles
- **rain**: umbrella (ptyCode 1/2/4 + 우산 추천 시)
- **mask**: kf94 (dustGrade 3/4 시)

매핑에 없는 ID는 카테고리 기본 변형으로 폴백 (예: 알 수 없는 `top-*` → `longsleeve`).

### 5. SVG path 추출 출처

기존 10개 SVG (`public/illust/outfit/*.svg`)에서 부위별 path를 추출합니다. 예시 (`golf-look.svg`에서 직접 확인):

- 폴로 셔츠 path → `top.polo` 변형 (line 29-44)
- 골프 슬랙스 + 벨트 → `bottom.slacks` (line 47-54)
- 골프화 → `foot.golf` (line 67-75)
- 골프 캡 → `acc.hat.cap` (line 9-16)
- 골프 글러브 → `acc.gloves.golf` (line 57-61)

다른 SVG에서도 같은 방식으로 발췌. 캔버스는 동일하게 `viewBox="0 0 200 240"`을 유지하고, 좌표·색상은 가능한 그대로 옮겨 디자인 톤이 유지되도록 함.

### 6. 성별 분기

`OutfitInput.gender`에 따라 일부 변형이 다른 path를 사용 (예: 머리 길이, 신체 비율 미세 조정). 단, 작업량 폭증을 막기 위해 **머리/얼굴 path 1세트 (남) + 1세트 (여)** 만 두고 나머지는 ID 매핑이 성별 차이를 흡수하도록 설계 (`top-blouse` vs `top-tshirt`처럼 ID가 이미 분리되어 있음).

### 7. 배경 (scene)

기존 `pickHeroIllust(zone, activity, ptyCode)`가 반환하는 `illustKey`는 **배경 결정자**로만 사용:

- `winter-heavy` / `snow-gear` → 눈송이
- `rain-gear` → 빗방울
- `summer-light` → 해
- `fall-layered` → 낙엽
- `beach-look` → 파도·모래
- `ski-look` → 산·눈
- `golf-look` → 잔디·깃발
- 그 외 → 단색 배경

배경은 캐릭터와 무관하게 항상 표시.

---

## 변경할 파일

### 수정

| 파일 | 변경 내용 |
|---|---|
| `components/outfit/OutfitItemCard.tsx` | `useState` 제거 → `checked: boolean`, `onToggle: () => void` prop으로 controlled 컴포넌트화. `aria-pressed`, 스타일 로직은 그대로. |
| `components/outfit/OutfitResult.tsx` | `wearing` 맵 상태(`Record<string, boolean>`) 추가, `result` 변경 시 리셋, 카드 렌더에 prop 주입, 체크된 아이템만 필터해 `OutfitHeroIllustration`에 `wearingItems` 전달. |
| `components/outfit/OutfitHeroIllustration.tsx` | 새 prop `wearingItems?: OutfitItem[]`, `gender?: GenderType`. `wearingItems`가 있으면 `DynamicOutfitIllustration` 렌더, 없으면 기존 `<Image>` 폴백. 라벨 부분은 유지하되, 동적 모드일 때 라벨을 "내 코디" 같은 표현으로 바꿀지는 구현 시 결정 (기본은 기존 라벨 유지). |

### 신규

| 파일 | 역할 |
|---|---|
| `components/outfit/illustration/DynamicOutfitIllustration.tsx` | 합성 루트. `<svg viewBox="0 0 200 240">` 내부에서 z-order대로 레이어 그룹 호출. props: `items`, `gender`, `illustKey`, `size`. |
| `components/outfit/illustration/itemLayerMap.ts` | 카테고리별 `Record<itemId, variant>` 매핑 + `pickVariant(category, items)` 헬퍼. |
| `components/outfit/illustration/layers/Body.tsx` | 머리·목·팔·다리 (gender별 분기). |
| `components/outfit/illustration/layers/Scene.tsx` | 배경 (illustKey 기반). |
| `components/outfit/illustration/layers/Top.tsx` | 상의 변형 path들. |
| `components/outfit/illustration/layers/Mid.tsx` | 미들레이어 변형. |
| `components/outfit/illustration/layers/Outer.tsx` | 아우터 변형. |
| `components/outfit/illustration/layers/Bottom.tsx` | 하의 변형. |
| `components/outfit/illustration/layers/Foot.tsx` | 신발 변형. |
| `components/outfit/illustration/layers/Acc.tsx` | 모자/목도리/장갑/선글라스 등 (다중 슬롯). |
| `components/outfit/illustration/layers/RainMask.tsx` | 우산 + 마스크. |

`base` 레이어는 양이 적어 `Body.tsx` 끝 또는 `Top.tsx` 시작에 인라인 처리 (별도 파일 X).

---

## 재사용할 기존 자산

- **아이템 ID 출처**: `lib/outfit/rules.ts` — `getBaseItems`, `getActivityItems`, `getMicroclimateItems`. 매핑 테이블 작성 시 이 세 함수가 만들어내는 모든 ID를 빠짐없이 커버해야 함.
- **타입**: `types/outfit.ts` — `OutfitItem`, `OutfitCategory`, `HeroIllustKey`, `GenderType`. 신규 타입은 최소화하고 기존 타입 재사용.
- **path 추출원**: `public/illust/outfit/*.svg` 10개 파일. 색상·viewBox·곡선 좌표를 그대로 옮김.
- **현재 라벨 함수**: `OutfitHeroIllustration.tsx:24` `heroLabel(...)` — 동적 모드에서도 그대로 호출.
- **카테고리 라벨**: `OutfitResult.tsx:15` `CATEGORY_LABELS` — UI 어디에서도 변경 없음.

---

## 매핑 테이블 초안 (구현 시 확정)

`lib/outfit/rules.ts`에서 발견한 모든 아이템 ID를 카테고리별로 정리. 구현 단계에서 빠진 게 있는지 다시 확인.

```
base:
  top-thermal, bottom-leggings-thermal, top-ski-inner

top:
  top-tshirt, top-blouse, top-longsleeve, top-longsleeve-f,
  top-knit, top-shirt, top-swimsuit, acc-rashguard,
  top-golf-skirt (실제로는 bottom 카테고리 — 매핑 시 주의)

mid:
  mid-hoodie, mid-cardigan-light, mid-cardigan, mid-cardigan-f,
  mid-sweater, mid-sweater-f, mc-hiking-midlayer, mc-golf-windvest

outer:
  outer-jacket, outer-jacket-f, outer-coat, outer-coat-f,
  outer-padding, outer-ski-jacket,
  mc-river-windbreaker, mc-river-windbreaker-mild,
  mc-hiking-windbreaker, mc-beach-coverup

bottom:
  bottom-skirt-mini, bottom-dress, bottom-shorts-m,
  bottom-linen-pants-f, bottom-midi-skirt, bottom-wide-pants,
  bottom-midi-skirt-mild, bottom-pants, bottom-slacks-f,
  bottom-long-skirt, bottom-slacks-m, bottom-warm-pants-f,
  bottom-warm-pants, bottom-ski-pants, top-golf-skirt

foot:
  foot-hiking, foot-sneaker, foot-golf, foot-sandal,
  foot-sandal-f, foot-ski, foot-boots, foot-boots-f, foot-loafer

acc (다중 슬롯, 한 번에 여러 개 표시):
  hat 슬롯: acc-golf-hat, acc-buff, acc-headband, acc-helmet,
            acc-earflap, acc-beaniehat-f, acc-hat-sun, acc-hat-sun-f,
            mc-beach-uvhat
  goggle 슬롯: acc-sunglasses, acc-goggles
  neck 슬롯: acc-scarf, acc-scarf-f, acc-neckwarmer,
              mc-golf-coolingneck
  glove 슬롯: acc-gloves, acc-gloves-f, acc-gloves-sport,
                acc-ski-gloves, acc-golf-glove
  arm 슬롯: mc-golf-armsleeve
  bag 슬롯: acc-bag-f
  기타 비주얼화 생략(스틱·선크림·원피스 대체 등): acc-stick,
            mc-beach-suncream
```

---

## 검증 방법

1. **개발 서버 실행**: `cd weatherfit && npm run dev` → `http://localhost:3000` 접속.
2. **시나리오별 시각 확인**:
   - 활동 = 골프, 시간대 변경 → 폴로·슬랙스·골프화·캡이 그려지는지
   - 활동 = 스키, 한겨울 → 스키재킷·스키팬츠·헬멧·고글·스키화 표시
   - 활동 = 해변, 한낮 → 래시가드·반바지·샌들·선글라스·챙넓은모자
   - 비 ON (`ptyCode=1`) → 우산 레이어 표시
   - 미세먼지 매우나쁨 → 마스크 레이어 표시
   - 성별 토글 → 상의/하의 변형이 적절히 바뀌는지 (블라우스 ↔ 티셔츠 등)
3. **체크박스 연동 확인**:
   - 추천 직후: 모든 카드가 체크 상태(녹색·취소선)로 시작 → 사용자 의도와 맞는지 디자인 검토. 만약 어색하면 시작 상태를 "체크 해제 (= 입은 모습이 기본)"로 반전. **구현 단계에서 첫 시연 후 결정**.
   - 카드 하나 토글 → 일러스트에서 해당 옷이 즉시 사라지는지/다시 나타나는지
   - 다른 아이템에 영향 없이 독립적으로 토글되는지
   - `result`가 바뀌면 (시간대·활동 변경) 체크 상태가 새 추천 기준으로 리셋되는지
4. **타입·빌드 검증**: `npx tsc --noEmit`, `npm run build` 통과.
5. **접근성**: 카드의 `aria-pressed`/`aria-label`이 "챙김/미챙김" → "입음/안 입음"으로 의미가 바뀌므로 라벨 문구 갱신.

---

## 주의 사항

- **AGENTS.md 경고**: `weatherfit/AGENTS.md`에 "This is NOT the Next.js you know"라는 안내가 있음. SVG는 Next 버전과 무관한 React 마크업이므로 영향 없음. 이미지 컴포넌트(`next/image`)는 동적 일러스트 모드에서는 사용하지 않으므로 호환성 이슈 없음.
- **번들 크기**: 인라인 SVG path가 늘어나지만 카테고리당 5~7개 변형 × 평균 200자 path = 약 10~20KB 수준, 허용 범위.
- **초기 체크 상태 정책**: 기본은 "전부 체크됨 (= 입은 상태)" 으로 시작. 구현 후 첫 시연에서 사용자가 "기본은 빈 캐릭터에서 시작해 입혀가는 게 직관적이다"라고 판단하면 반전. 이 결정은 구현 PR 단계에서 함께 검토.
- **scope 제어**: 이번 작업에서는 `OutfitResult` 내부만 수정. 추천 알고리즘(`lib/outfit/recommender.ts`, `lib/outfit/rules.ts`)은 건드리지 않음.

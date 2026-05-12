# 복장 캐릭터·악세사리 에셋 가이드

이 문서는 **전신 캐릭터 PNG**와 **소형 악세사리 PNG**의 네이밍·스펙·앱 연동을 한곳에서 관리합니다.  
에셋을 추가·교체할 때는 **이 파일을 먼저 수정**한 뒤, 필요 시 아래에 적힌 코드 경로를 반영하세요.

---

## 0. 캐릭터 캐논 (Locked Reference)

> **남자·여자 캐릭터 두 명은 각각 고정된 한 명**입니다. 슬롯·계절·날씨에 따라 **복장만** 바꾸고 얼굴·체형·헤어·라인 스타일은 **모든 변형에서 동일하게** 유지합니다.

| 성별 | 캐논 파일 | 잠금 항목 |
|------|-----------|------------|
| 남자 | `public/outfit/characters/male-cool-v1.webp` | 한국 웹툰풍, 얇은 회갈색 라인 + 가벼운 수채 워시, 슬림 톨 ~7등신, 짧은 흑갈색 부드러운 웨이브 헤어, 아몬드형 눈·옅은 갈색 동공, 무표정에 가까운 차분함, 머리만 살짝 우측 |
| 여자 | `public/outfit/characters/female-warm-v1.png` | 모바일 앱 플랫 카툰, 얇고 균일한 검정 외곽선 + 플랫 파스텔, ~5.5등신, 어깨선 밤색 단발 + 안쪽 끝말림, 둥근 얼굴·점 같은 까만 눈·옅은 미소·핑크 볼터치, **코·속눈썹·귀 디테일 없음** |

### 0.1 잠금 프롬프트

캐논 잠금 프롬프트는 `.claude/skills/outfit-asset/SKILL.md` §1-A 의 **MALE / FEMALE STYLE LOCK** 블록을 그대로 사용합니다. 새 캐릭터를 생성할 때는 항상 그 블록을 가장 앞에 통째로 붙여 넣고, **그 뒤에 슬롯별 한 줄(의상)** 만 갈아끼웁니다.

### 0.2 절대 규칙

- **두 캐논 파일은 절대 덮어쓰지 않습니다.** 새 버전이 필요하면 `-v2` 로 추가.
- 같은 성별의 모든 슬롯은 **얼굴·체형·헤어·라인 스타일이 캐논과 100% 동일**해야 합니다. 다른 사람으로 보이면 재생성.
- 베이스 슬롯에는 **우산·모자·선글라스·가방 금지** — 이는 `public/outfit/accessories/` 에서 별도 조합.
- 남자 캐논은 회갈색 얇은 라인 + 수채, 여자 캐논은 검정 얇은 라인 + 플랫 파스텔 — **두 스타일을 섞지 않습니다.**

### 0.3 현재 자산 스타일 매트릭스

| 파일 | 캐논 적합도 | 액션 |
|------|--------------|------|
| `male-cool-v1.webp` ★ | 캐논 | 유지 (수정 금지) |
| `male-cold-v1.png` | 유사 (인물 다름) | 재생성 권장 |
| `male-freezing-v1.png` | 유사 (인물 다름) | 재생성 권장 |
| `male-mild-v1.png` | **완전 다름** (두꺼운 검정 카툰) | **재생성 필수** |
| `male-warm-v1.png` | **완전 다름** (두꺼운 검정 카툰) | **재생성 필수** |
| `male-hot-v1.png` | **완전 다름** (두꺼운 검정 카툰) | **재생성 필수** |
| `female-warm-v1.png` ★ | 캐논 | 유지 (수정 금지) |
| `female-mild-v1.png` | 매우 유사 | 유지 (선택적 미세 재생성) |
| `female-hot-v1.png` | 매우 유사 | 유지 |
| `female-cold-v1.png` | **다름** (세미리얼 애니) | **재생성 필수** |
| `female-cool-v1.png` | **다름** (세미리얼 애니) | **재생성 필수** |
| `female-freezing-v1.png` | **다름** (세미리얼 애니) | **재생성 필수** |

---

## 1. 전신 캐릭터 (TempZone 슬롯)

### 1.1 파일 규칙 (현재 앱과 동일)

| 항목 | 규칙 |
|------|------|
| 디렉터리 | `weatherfit/public/outfit/characters/` |
| 파일명 | `female-{slot}-v1.png` 또는 `male-{slot}-v1.png` (예: `male-freezing-v1.png`) |
| 예시 | `female-mild-v1.png`, `male-cool-v1.png` |
| `slot` | 온도대·의상 레벨을 나타내는 짧은 영문 토큰 (`mild`, `cool`, `cold`, `freezing`, `warm`, `hot` 등) |
| 배경 | **순백** (#FFFFFF), 그림자·바닥 없음 |
| 구도 | 세로 풀바디, 정면·중립 포즈, **모자·선글라스·가방·우산 없음** (베이스 캐릭터만) |
| 스타일 | 플랫 2D 벡터 느낌, **얇고 균일한 검정 외곽선**, 파스텔 톤, 친근한 미니멀 |

앱에서 URL을 만드는 함수: `lib/outfit/characterIllust.ts` 의 `outfitCharacterImageSrc`  
구간 → 슬롯 매핑: 같은 파일을 여러 구간에서 쓰려면 `SLOT_BY_ZONE` 만 조정하면 됩니다.

### 1.2 `TempZone` ↔ 권장 `slot` (참고)

`types/outfit.ts` 의 `TempZone` 과 설계상 대응 예시입니다. 실제 매핑은 `SLOT_BY_ZONE` 이 최종입니다.

| TempZone | 의미(체감) | 권장 slot (풀세트 시) |
|----------|------------|------------------------|
| `hot` | 28°C+ | `hot` |
| `warm` | 23~27°C | `warm` |
| `mild` | 18~22°C | `mild` (현재 배포됨) |
| `cool` | 12~17°C | `cool` |
| `cold` | 6~11°C | `cold` |
| `freezing` | 0~5°C 및 0°C 미만 | `freezing` |

---

## 2. 제작 범위 제안 (전신 캐릭터) — **작업 전에 결정**

아래는 **같은 스타일·같은 네이밍 규칙**을 유지한 채, 어느 정도까지 그릴지에 대한 권장안입니다.

| 단계 | 포함 PNG | 장수 (남+여) | 설명 |
|------|-----------|--------------|------|
| **MVP** | `cool`, `cold`, `freezing` 각 1종 | **6장** | 이전에 논의한 “선선·추위·한파” 전용만 추가. 앱 체감 하위 구간부터 시각적 차별화. |
| **표준** | MVP + `warm` | **8장** | 봄·가을 낮 기온대까지 분리. `mild` 와 겹치는 느낌을 줄이고 싶을 때 적합. |
| **풀세트** | `hot`~`freezing` 전 구간 | **12장** | 모든 `TempZone` 에 전용 의상. 유지보수·용량·제작 비용 최대. |

**권장:** 처음에는 **MVP(6장)** 로 배포하고, 사용자 반응·캡처 품질을 본 뒤 **표준(8장)** 으로 확장하는 방식이 부담이 적습니다.  
풀세트는 브랜드 일관성이 매우 중요할 때만 권합니다.

**작업 순서 (MVP 예시):**

1. `female-cool-v1.png`, `male-cool-v1.png` … 동일 규칙으로 6파일을 `public/outfit/characters/` 에 저장  
2. 이 문서 하단 **변경 이력**에 파일명·날짜 기록  
3. `lib/outfit/characterIllust.ts` 의 `SLOT_BY_ZONE` 에서 `cool` → `'cool'`, `cold` → `'cold'`, `freezing` → `'freezing'` 으로 변경 (파일이 없으면 404이므로 **파일 추가와 커밋을 같은 PR**에 묶기)

---

## 3. 소형 악세사리 (별도 UI 구성용)

전신 캐릭터보다 **작게** 쓰는 보조 일러스트입니다. 우천·바람·자외선·한파 등 **조건부 배지·오버레이·칩 옆 아이콘**에 붙이기 좋습니다.

### 3.1 디렉터리·파일 (현재 배포)

| 파일 | 용도 |
|------|------|
| `public/outfit/accessories/acc-umbrella-open-v1.png` | 펼친 우산 |
| `public/outfit/accessories/acc-hat-male-v1.png` | 모자 일러 (남성·캡 형) |
| `public/outfit/accessories/acc-hat-female-wide-v1.png` | 모자 일러 (여성·와이드 챙) — 앱 아이템명은 공통 **모자** |
| `public/outfit/accessories/acc-sunglasses-v1.png` | 선글라스 |
| `public/outfit/accessories/acc-gloves-v1.png` | 장갑 |
| `public/outfit/accessories/acc-scarf-v1.png` | 목도리(스카프/머플러 계열) |
| `public/outfit/accessories/acc-windbreaker-v1.png` | 바람막이(바람 대비) |

코드에서 경로 객체: `lib/outfit/accessoryIllust.ts` (`outfitAccessorySrc`, `OUTFIT_ACCESSORY_ASSETS`)

### 3.2 스펙 권장

| 항목 | 권장 |
|------|------|
| 캔버스 | 대략 **384~512px 정사각형** (전신 1000px급 대비 작게) |
| 배경 | 생성 시 **흰 배경** — UI에서 오버레이할 때는 디자이너 도구로 **배경 제거(알파)** 한 버전을 `acc-xxx-v1-alpha.png` 등으로 두고 교체해도 됨 |
| 스타일 | 전신 캐릭터와 동일: **얇은 검정 라인 + 파스텔**, 단일 소품만, 문자·워터마크 없음 |
| 용도 분리 | **전신 베이스에는 우산·모자 등을 넣지 않음** — 이 폴더 에셋만으로 조합 |

### 3.3 동일 스타일로 추가·재생성하는 방법

1. **프롬프트 공통 블록** (이미지 생성 AI에 그대로 붙여넣기용):

   > Flat 2D vector illustration, thin consistent black outlines, soft muted pastel palette, friendly minimal mobile-app style, single object only, no character, no text, pure white background, generous margin, centered.

2. **객체별 한 줄**만 바꿔서 생성 (예: 우산):

   > Open umbrella from slight angle, canopy fully open, simple curved handle.

3. 생성 후 **파일명**을 `acc-{이름}-v1.png` 로 저장하고, `accessoryIllust.ts` 에 키를 추가한 뒤 이 문서 표(3.1)에 한 줄 추가.

4. **버전 갱신** 시 파일명을 `v2` 로 두고, 코드에서 `v1` → `v2` 로 바꾸거나, 캐시 무력화를 위해 쿼리스트링을 붙이는 방식을 택할 수 있습니다.

### 3.4 일러스트 탭 좌우 칼럼 노출 규칙

`OutfitIllustPanel` 의 `CategoryBlock` 행에 소품 PNG가 합류합니다. 분기 로직: `lib/outfit/outfitWeatherAccessories.ts` 의 `accessoriesByOutfitCategory`.

| 카테고리 행 | 소품 | 조건(요약) |
|-------------|------|-------------|
| `rain` | 우산 | `rainAlert` 또는 `weatherSky.ptyCode` ≠ `'0'` |
| `mid` | 바람막이 | `windAlert` |
| `acc` | 모자·선글라스 | 강한 햇빛: `uvAlert` 또는 (`showSunshine` + `hot`/`warm`) → **모자**(일러: 여 `acc-hat-female-wide-v1`, 남 `acc-hat-male-v1`)+선글라스. 약한 맑음: `mild` + `showSunshine` 이고 `uvAlert` 없음 → 선글라스만. 그 외 `uvAlert`만 → 선글라스 |
| `acc` | 장갑 | `tempZone` 이 `cold` 또는 `freezing` |

규칙을 바꿀 때는 위 함수와 이 표를 함께 수정합니다.

**일러스트 탭 중복 제거:** `result.items` 칩에 이미 같은 종류가 있으면 해당 행의 날씨 보조 **PNG는 숨김**합니다. (`outfitItemCoversAccessoryIllust`)

**일러스트 탭 칩 → PNG:** `OutfitIllustPanel` 의 `CategoryBlock` 에서 `outfitItemToAccessoryKey` 로 매핑되는 항목은 **텍스트 칩 대신** `public/outfit/accessories` 이미지(약 2배 크기)로 표시합니다. 매핑 없는 항목은 기존 칩 유지. **아이템 목록** 탭은 항상 텍스트 목록 그대로입니다.

---

## 4. 앱 코드 체크리스트 (에셋 변경 시)

- [ ] `public/outfit/characters/` 또는 `public/outfit/accessories/` 에 PNG 반영  
- [ ] `lib/outfit/characterIllust.ts` — `SLOT_BY_ZONE` 또는 파일명 규칙 변경 시  
- [ ] `lib/outfit/accessoryIllust.ts` — 악세사리 키·경로 추가 시  
- [ ] `lib/outfit/outfitWeatherAccessories.ts` — 날씨별로 어떤 행에 붙일지 변경 시  
- [ ] 이 문서 **변경 이력** 및 **§3.4** 업데이트  

---

## 4-A. 상황 캐릭터 슬롯 (1차 + 2차)

온도 슬롯 외에 **날씨·환경에 특화된 캐릭터**입니다. PNG가 등록되면 `lib/outfit/characterIllust.ts` 의 `AVAILABLE_SITUATION_SLOTS` 에 슬롯명을 추가해야 자동으로 활성화됩니다. 미등록 시 온도 슬롯으로 자동 폴백됩니다.

선택 우선순위 (`pickCharacterSlot`): **강설 > 강수(강/약) > 강한 햇빛 > 강풍 > 온도 폴백**

### 1차 (우천·강설) — 6장 (남·여 × 3)

| 슬롯 | 파일명 (남) | 파일명 (여) | 트리거 조건 |
|------|-------------|-------------|--------------|
| `rain-light` | `male-rain-light-v1.png` | `female-rain-light-v1.png` | `ptyCode='1' or '4'`, 1시간 강수량 **<3mm** (약한 비) |
| `rain-heavy` | `male-rain-heavy-v1.png` | `female-rain-heavy-v1.png` | `ptyCode='1' or '4'`, 1시간 강수량 **≥3mm** (보통 비 이상) |
| `snow` | `male-snow-v1.png` | `female-snow-v1.png` | `ptyCode='2' or '3'` (눈·비눈) |

### 2차 (햇빛·바람) — 4장 (남·여 × 2)

| 슬롯 | 파일명 (남) | 파일명 (여) | 트리거 조건 |
|------|-------------|-------------|--------------|
| `sunny-uv` | `male-sunny-uv-v1.png` | `female-sunny-uv-v1.png` | `showSunshine=true` 이고 `tempZone='hot' or 'warm'` |
| `windy` | `male-windy-v1.png` | `female-windy-v1.png` | `windAlert=true` (풍속 14m/s↑) |

### 4-A.1 슬롯별 생성 프롬프트 (캐논 블록 + 객체별 한 줄)

> ⚠️ **공통 스타일 블록을 더 이상 사용하지 않습니다.** 남자 캐릭터는 `.claude/skills/outfit-asset/SKILL.md` §1-A 의 **MALE STYLE LOCK**, 여자 캐릭터는 **FEMALE STYLE LOCK** 을 그대로 가장 앞에 붙여넣고, 아래 한 줄만 갈아끼웁니다. 두 캐논 잠금 블록은 절대 변형하지 않습니다.

객체별 한 줄(같은 슬롯은 남·여 각각 1장씩 생성):

| 슬롯 | 추가 문구 |
|------|-----------|
| `rain-light` (M) | Beige trench coat, slacks and loafers, holding a navy open umbrella tilted slightly above the head, the other arm relaxed at the side, dry shoes. |
| `rain-light` (F) | Trench coat or knee-length raincoat, midi skirt or pants, loafers, holding a pastel-yellow open umbrella tilted slightly above the head. |
| `rain-heavy` (M) | Yellow or olive hooded raincoat with the hood up, dark pants, black waterproof ankle boots, both hands tucked near the pockets, slight shoulder hunch. |
| `rain-heavy` (F) | Belted yellow raincoat with the hood up, slim pants, chelsea-style waterproof boots, both hands tucked near pockets. |
| `snow` (M) | Long charcoal puffer coat, knitted beanie, soft scarf wrapped around the neck, dark thermal pants, winter boots, hands in pockets, subtle breath cloud near the mouth. |
| `snow` (F) | Ivory puffer coat, knitted beanie, soft cream scarf, slim thermal pants, white snow boots, hands in pockets, soft smile, tiny breath cloud near the mouth. |
| `sunny-uv` (M) | Short-sleeve light shirt, beige chinos, white sneakers, baseball cap and sunglasses, one hand lightly touching the cap brim. |
| `sunny-uv` (F) | Light linen short-sleeve blouse, beige knee-length shorts or skirt, wide-brim straw sun hat, sunglasses, white sandals, one hand softly holding the hat brim. |
| `windy` (M) | Lightweight grey windbreaker half-zipped, slim pants, sneakers, hair and jacket hem softly swept sideways by wind, one hand holding the jacket collar. |
| `windy` (F) | Lightweight pastel windbreaker, ankle pants, sneakers, hair softly swept sideways by wind with a small headband keeping the fringe tidy, one hand softly holding the jacket collar. |

### 4-A.2 PNG 등록 순서

1. AI 이미지 도구로 위 프롬프트 + 공통 스타일 블록을 사용해 PNG 생성 (2:3 비율, 흰 배경)
2. `weatherfit/public/outfit/characters/` 에 `{gender}-{slot}-v1.png` 파일명으로 저장
3. `node scripts/convert-outfit-to-webp.mjs` 실행 → `.webp` 자동 생성
4. `lib/outfit/characterIllust.ts` 의 `AVAILABLE_SITUATION_SLOTS` Set 에 슬롯 추가 (주석 해제)
5. `npm run build` 로 검증, 변경 이력 §5 에 한 줄 기록

### 4-A.3 캐릭터 뒤 반투명 날씨 배경

별도 PNG 없이 **SVG로 자동 렌더**됩니다 — `components/outfit/illustration/WeatherCharBg.tsx` 가 우산·눈송이·햇살·바람 라인을 옅은 색 + 알파 0.10~0.55 로 그려 칩 영역 가독성을 보존합니다. 새 배경 변형 필요 시 이 파일의 `WeatherBgMode` 와 `resolveWeatherBgMode` 만 확장하면 됩니다.

---

## 4-B. 여성 라이프스타일 v2 베리에이션 (선택 슬롯)

남자 캐릭터 대비 여성 캐릭터의 시각적 다양성을 키우기 위한 **선택적 v2 변형**입니다. 같은 캐논(얼굴·체형·헤어 동일)을 유지하면서 베이스 슬롯과 다른 무드의 의상을 제공합니다. v1 베이스를 우선 노출하고, 코드에서 옵션이 켜졌을 때만 v2 로 스왑합니다.

| 슬롯 | 파일명 | 의상 한 줄 (FEMALE STYLE LOCK 뒤에 붙임) |
|------|---------|---------------------------------------------|
| `warm-v2` | `female-warm-v2.png` | Knee-length floral pastel sundress with thin shoulder straps, tan flat sandals. |
| `cool-v2` | `female-cool-v2.png` | Beige trench coat open over a white blouse, ankle-length camel midi skirt, brown ankle boots. |
| `mild-v2` | `female-mild-v2.png` | Cream wide-collar blouse, A-line beige midi skirt, white sneakers, small shoulder bag strap visible (no bag drawn). |

### 4-B.1 v2 등록 순서

1. AI 이미지 도구로 위 한 줄 + `FEMALE STYLE LOCK` 으로 PNG 생성
2. `weatherfit/public/outfit/characters/` 에 `female-{slot}-v2.png` 로 저장
3. `node scripts/convert-outfit-to-webp.mjs` 실행 → `.webp` 자동 생성
4. (선택) `lib/outfit/characterIllust.ts` 의 `outfitCharacterImageSrc` 에 v2 분기 추가 — 예: 사용자 설정·요일·날짜 기반 토글
5. 본 문서 §5 변경 이력에 기록

코드 분기를 추가하지 않더라도 PNG·WebP 만 자산 폴더에 두면 추후 손쉽게 활성화할 수 있습니다.

---

## 5. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-30 | 문서 신설. `mild` 전신 2종(기존) 유지. 악세사리 6종 PNG 및 `accessoryIllust.ts` 추가. |
| 2026-04-30 | 전신 풀세트: `hot`/`warm`/`cool`/`cold`/`freezing` 남·녀 각 1 (`*-{slot}-v1.png` 10파일) 배포. `characterIllust.ts` 의 `SLOT_BY_ZONE` 을 `TempZone` 1:1 슬롯으로 연동. |
| 2026-04-30 | 일러스트 탭 좌우 `CategoryBlock` 에 날씨 조건부 소품(`outfitWeatherAccessories` + §3.4). |
| 2026-04-30 | 추천 아이템명: 챙 넓은 모자 등 → 공통 **모자**로 통일(`rules`/`recommender`). 모자 PNG 사용자 교체 반영. |
| 2026-04-30 | 추천 칩과 동일 종류 소품은 일러스트 탭 PNG 생략(`outfitItemCoversAccessoryIllust`). |
| 2026-04-30 | 일러스트 탭: 매핑되는 추천 항목은 칩 대신 악세사리 PNG(`outfitItemToAccessoryKey`), 크기 확대. |
| 2026-04-30 | 목도리 소품 `acc-scarf-v1.png` 추가 및 경로 연동(`accessoryIllust.ts`). |
| 2026-05-11 | 캐릭터 뒤 반투명 날씨 배경 SVG (`WeatherCharBg`) 추가. 1차+2차 상황 슬롯 5종(`rain-light`, `rain-heavy`, `snow`, `sunny-uv`, `windy`) 인프라(`pickCharacterSlot` + `AVAILABLE_SITUATION_SLOTS`) 배포 — PNG 미등록 상태에서 자동 폴백. |
| 2026-05-12 | **캐릭터 캐논 잠금**: 남자 = `male-cool-v1.webp`, 여자 = `female-warm-v1.png`. §0 신설, §1·§4-A.1 의 공통 스타일 블록을 **성별별 STYLE LOCK** 으로 교체. 스킬(`outfit-asset/SKILL.md` §1-A) 동기화. **재생성 대상**: `male-mild`/`warm`/`hot`-v1 (필수), `male-cold`/`freezing`-v1 (권장), `female-cold`/`cool`/`freezing`-v1 (필수). 여성 라이프스타일 v2 슬롯 3종 (§4-B) 신설. |
| 2026-05-12 | **캐릭터 PNG 자동 생성 스크립트 도입** — `scripts/generate-character-asset.mjs` (Google Gemini `gemini-2.5-flash-image`, 캐논 레퍼런스 첨부 + STYLE LOCK + 슬롯 한 줄). `@google/genai`, `sharp` devDependency 추가. 스킬 §2 신설. **전체 23장 일괄 재생성 완료**: 베이스 10 (male/female × hot/warm/mild/cool/cold/freezing, 캐논 2장 제외) + 상황 10 (rain-light/rain-heavy/snow/sunny-uv/windy × 남·여) + 여성 v2 3 (warm/cool/mild). |
| 2026-05-12 | **상황 슬롯 활성화** — `lib/outfit/characterIllust.ts` `AVAILABLE_SITUATION_SLOTS` 에 5개 슬롯(`rain-light`, `rain-heavy`, `snow`, `sunny-uv`, `windy`) 등록. 이제 `pickCharacterSlot` 이 강수·강설·강한 햇빛·강풍 조건에서 자동으로 상황 캐릭터를 선택. |

---

*이후 에셋 추가·이름 변경·슬롯 확장은 위 표와 변경 이력만 갱신해도 됩니다.*

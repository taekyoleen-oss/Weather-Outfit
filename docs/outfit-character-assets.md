# 복장 캐릭터·악세사리 에셋 가이드

이 문서는 **전신 캐릭터 PNG**와 **소형 악세사리 PNG**의 네이밍·스펙·앱 연동을 한곳에서 관리합니다.  
에셋을 추가·교체할 때는 **이 파일을 먼저 수정**한 뒤, 필요 시 아래에 적힌 코드 경로를 반영하세요.

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

## 5. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-30 | 문서 신설. `mild` 전신 2종(기존) 유지. 악세사리 6종 PNG 및 `accessoryIllust.ts` 추가. |
| 2026-04-30 | 전신 풀세트: `hot`/`warm`/`cool`/`cold`/`freezing` 남·녀 각 1 (`*-{slot}-v1.png` 10파일) 배포. `characterIllust.ts` 의 `SLOT_BY_ZONE` 을 `TempZone` 1:1 슬롯으로 연동. |
| 2026-04-30 | 일러스트 탭 좌우 `CategoryBlock` 에 날씨 조건부 소품(`outfitWeatherAccessories` + §3.4). |
| 2026-04-30 | 추천 아이템명: 챙 넓은 모자 등 → 공통 **모자**로 통일(`rules`/`recommender`). 모자 PNG 사용자 교체 반영. |
| 2026-04-30 | 추천 칩과 동일 종류 소품은 일러스트 탭 PNG 생략(`outfitItemCoversAccessoryIllust`). |
| 2026-04-30 | 일러스트 탭: 매핑되는 추천 항목은 칩 대신 악세사리 PNG(`outfitItemToAccessoryKey`), 크기 확대. |

---

*이후 에셋 추가·이름 변경·슬롯 확장은 위 표와 변경 이력만 갱신해도 됩니다.*

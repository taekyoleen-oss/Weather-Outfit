# Skill: outfit-asset — Weather Outfit 복장 자산 생성 & 최적화

## 트리거 조건

다음 중 하나에 해당하면 이 스킬을 실행합니다.

- "새 복장 추가해줘", "새 악세사리 추가해줘", "캐릭터 이미지 추가해줘"
- "PNG 최적화해줘", "WebP로 변환해줘", "이미지 압축해줘"
- "복장 자산 만들어줘", "outfit asset 추가"
- 사용자가 PNG 파일 경로를 제시하면서 앱에 적용 요청

---

## 스킬 목적

Weather Outfit의 `public/outfit/` 자산을 **동일한 스타일**로 제작·변환·앱 연동하는 전 과정을 자동화합니다.

1. **스타일 가이드** — 새 PNG를 생성할 때 사용하는 프롬프트 규칙
2. **AI 이미지 생성** — `scripts/generate-character-asset.mjs` (Google Gemini Nano Banana, 캐논 이미지 첨부 자동)
3. **PNG → WebP 변환** — `scripts/convert-outfit-to-webp.mjs` 실행
4. **코드 연동** — `accessoryIllust.ts` / `characterIllust.ts` + 컴포넌트 업데이트

---

## 1. 자산 스타일 가이드

> **중요:** 캐릭터(전신 인물) 스타일은 **남자·여자 캐논이 다릅니다.** 같은 캐논 블록을 매번 그대로 붙여 일관성을 강제해야 합니다. 악세사리(소품)는 별도의 단일 공통 스타일을 사용합니다.

### 1-A. 전신 캐릭터 — 캐논 (Locked Reference)

> 🎯 **권장 워크플로우:** 텍스트 프롬프트만으로는 같은 인물을 100% 재현하기 어렵습니다. **레퍼런스 이미지 첨부 기능** 을 지원하는 도구를 권장합니다:
> - **Google Gemini / Imagen (NanoBanana)** — 캐논 PNG 업로드 후 "keep the same character" 지시
> - **Midjourney** — `--cref <캐논 이미지 URL> --cw 100` (Character Reference, weight 100)
> - **OpenAI gpt-image-1** — 첫 호출에 캐논 PNG 를 reference 로 전달
>
> 위 도구 중 하나로 캐논 파일을 첨부하고, **STYLE LOCK 블록 + 슬롯 한 줄 의상** 만 프롬프트로 보내는 방식이 가장 안정적입니다. 텍스트 단독 생성 시에는 STYLE LOCK 블록을 반드시 가장 앞에 통째로 붙여 넣고, 결과가 캐논과 다른 사람으로 보이면 재시도.

**기준 파일 (재생성 금지, 모든 추가 캐릭터는 이 두 장과 같은 인물로 보여야 함):**

| 성별 | 캐논 파일 | 스타일 요약 |
|------|------------|--------------|
| 남자 | `public/outfit/characters/male-cool-v1.webp` | 한국 웹툰/만화 — soft line + 가벼운 수채 워시, **얇은 회갈색 라인**, 슬림 톨, ~7등신, 짧은 흑갈색 부드러운 웨이브 헤어, 아몬드형 눈·옅은 갈색 동공, 단정한 무표정, 머리만 살짝 우측 |
| 여자 | `public/outfit/characters/female-warm-v1.png` | 모바일 앱 플랫 카툰 — **얇고 균일한 검정 외곽선**, 5.5등신, 슬림, 어깨선 밤색 단발 + 안쪽 끝말림, 둥근 얼굴·점 같은 까만 눈·옅은 미소·핑크 볼터치, **코·속눈썹 디테일 없음** |

#### 캐논 잠금 프롬프트 (MALE)

새 남자 캐릭터를 생성할 때 **반드시** 가장 앞에 통째로 붙여 넣습니다. 변형 금지.

```
[STYLE LOCK — MALE]
Korean webtoon / manhwa illustration style — soft thin colored line + light watercolor wash.
NOT thick black outlines, NOT chibi.
Same young Korean man in his mid-20s, slim athletic build, ~178 cm tall, ~7 head body proportion.
Short tousled dark brown hair with a soft wavy fringe falling slightly to the right of the forehead.
Almond-shaped eyes with light brown irises, single eyelid crease, calm neutral expression,
head turned very slightly toward camera-right.
Pale skin, soft pink lips, no facial hair, no glasses.
Pure white background (#FFFFFF), no shadows, no floor, generous margin,
vertical 2:3 canvas, centered full-body standing pose.
Thin medium-grey outlines, gentle cel shading with soft watercolor wash, subtle clothing folds.
No text, no watermarks, no logos.
```

#### 캐논 잠금 프롬프트 (FEMALE)

새 여자 캐릭터를 생성할 때 **반드시** 가장 앞에 통째로 붙여 넣습니다. 변형 금지.

```
[STYLE LOCK — FEMALE]
Simple flat cartoon mobile-app illustration style — clean thin uniform black outlines, flat soft-pastel fills.
NOT semi-realistic, NOT anime, NOT watercolor.
Same young Korean woman in her mid-20s, slim slender build, ~5.5 head body proportion, slightly chibi feel.
Chestnut brown shoulder-length hair with eyebrow-grazing straight fringe and a gentle inward curl at the ends.
Round soft face, small simple solid-black dot eyes, faint thin smile,
two small pink blush dots on the cheeks.
NO nose line. NO eyelash detail. NO ear detail. Keep the face minimal.
Pose: straight front-facing, both arms relaxed at sides, gentle warm smile.
Pure white background (#FFFFFF), no shadows, no floor, generous margin,
vertical 2:3 canvas, centered full-body standing pose.
Thin uniform black outlines, flat pastel colors, NO heavy shading, only a few minimal cloth crease lines.
No text, no watermarks, no logos.
```

#### 1-A.1 슬롯별 의상 한 줄 (캐논 블록 뒤에 한 줄만 바꿔 붙여서 생성)

| 슬롯 | 남자 outfit 한 줄 | 여자 outfit 한 줄 |
|------|--------------------|---------------------|
| `freezing` | Long navy puffer coat (knee-length), thick grey scarf, dark thermal pants, dark winter boots, both hands in pockets. | Long ivory or pastel-blue puffer coat, soft cream scarf, slim thermal pants, white snow boots. |
| `cold` | Navy or charcoal wool pea coat over a cream knit sweater, dark wool pants, brown leather lace-up boots. | Beige or camel mid-length wool coat over a cream knit, grey wide-leg trousers, brown ankle boots. |
| `cool` | **(CANON)** Light blue denim shirt-jacket over a white tee, off-white wide-leg pants, grey running sneakers, hands tucked near pockets. | Sage green cardigan open over a white tee, light blue ankle pants, off-white sneakers. |
| `mild` | Beige knit cardigan open over a white tee, light beige slacks, white minimalist sneakers. | Pink ribbed cardigan open over a cream knit top, blue ankle jeans, ivory sneakers. |
| `warm` | Plain white short-sleeve T-shirt, slim light-blue jeans, white sneakers. | **(CANON)** White short-sleeve T-shirt, dusty-pink ankle pants, white sneakers. |
| `hot` | Light pastel-blue short-sleeve T-shirt, beige knee-length shorts, white slip-on sneakers. | Soft coral short-sleeve T-shirt, mint-green knee-length shorts, white sneakers. |

규칙:
- **베이스 슬롯에는 우산·모자·선글라스·가방 금지** (이는 악세사리 폴더에서 별도 조합)
- 상황 슬롯(`rain-*`, `snow`, `sunny-uv`, `windy`) 프롬프트는 `docs/outfit-character-assets.md` §4-A.1 참조
- 여성 라이프스타일 v2 베리에이션 (`warm-v2`, `cool-v2`, `mild-v2`) 은 같은 문서 §4-B 참조

#### 1-A.2 파일·스펙

| 항목 | 규칙 |
|------|------|
| 파일명 | `{gender}-{slot}-v1.png` (예: `female-hot-v1.png`). 라이프스타일 변형은 `-v2.png` |
| `gender` | `female` 또는 `male` |
| 권장 캔버스 | 세로 2:3, **768×1152** 또는 1024×1536 |
| 배경 | 순백 #FFFFFF, 그림자/바닥 없음 |
| 색역 | sRGB, 8-bit |

#### 1-A.3 재생성 필요 파일 (현재 캐논 불일치)

기존 파일 중 캐논과 스타일이 다른 항목은 **반드시 재생성**합니다. 캐논 파일 두 장은 절대 덮어쓰지 않습니다.

**남자 (캐논: male-cool-v1.webp 유지):**
| 파일 | 현재 상태 | 액션 |
|------|-----------|------|
| `male-mild-v1.png` | 두꺼운 검정 라인 카툰 (전혀 다름) | **재생성 필수** |
| `male-warm-v1.png` | 두꺼운 검정 라인 카툰 (전혀 다름) | **재생성 필수** |
| `male-hot-v1.png` | 두꺼운 검정 라인 카툰 (전혀 다름) | **재생성 필수** |
| `male-cold-v1.png` | 세미리얼 (캐논과 유사하지만 인물 다름) | 재생성 권장 |
| `male-freezing-v1.png` | 세미리얼 (캐논과 유사하지만 인물 다름) | 재생성 권장 |

**여자 (캐논: female-warm-v1.png 유지):**
| 파일 | 현재 상태 | 액션 |
|------|-----------|------|
| `female-cold-v1.png` | 세미리얼 애니 (전혀 다름) | **재생성 필수** |
| `female-cool-v1.png` | 세미리얼 애니 (전혀 다름) | **재생성 필수** |
| `female-freezing-v1.png` | 세미리얼 애니 (전혀 다름) | **재생성 필수** |
| `female-mild-v1.png` | 캐논과 매우 유사 | 유지 가능 (선택적 미세 재생성) |
| `female-hot-v1.png` | 캐논과 매우 유사 | 유지 |

재생성 후 항상 `node scripts/convert-outfit-to-webp.mjs` 로 WebP 갱신.

### 1-B. 소형 악세사리 (`public/outfit/accessories/`)

> 악세사리는 인물 캐논과 무관한 별도의 공통 스타일을 사용합니다. 아래 공통 블록을 모든 악세사리 프롬프트에 사용:

```
Flat 2D vector illustration, thin consistent black outlines, soft muted pastel palette,
friendly minimal mobile-app style, single object only, no character,
pure white background (#FFFFFF), no shadows, no floor, generous margin, centered composition.
No text, no watermarks, no logos.
```


| 항목 | 규칙 |
|------|------|
| 파일명 | `acc-{name}-v1.png` (예: `acc-mask-v1.png`) |
| 캔버스 | 정사각형 384–512px 권장 |
| 배경 | 흰 배경(#FFFFFF) — 필요 시 알파 채널 제거본도 같이 제공 |
| 내용 | 소품 단일 오브젝트, 캐릭터 없음 |

객체별 추가 프롬프트 예시:

```
Open umbrella from slight angle, canopy fully open, simple curved handle.
Baseball cap, front view, simple design.
Knit scarf loosely folded.
Winter gloves, pair, slightly overlapping.
Sunglasses, front view, simple frame.
Face mask (surgical), slightly angled, simple design.
```

---

## 2. 캐릭터 PNG 자동 생성 (Google Gemini Nano Banana)

`scripts/generate-character-asset.mjs` 는 캐논 이미지(`male-cool-v1.webp` / `female-warm-v1.png`)를 **레퍼런스 이미지로 첨부**하고 STYLE LOCK 블록 + 슬롯 의상 한 줄을 함께 보내, 같은 인물의 옷만 바꿔 PNG + WebP를 자동 출력합니다.

### 2.1 사전 준비 (1회)

1. **API 키 발급** — https://aistudio.google.com → "Get API Key" (무료 티어 사용 가능)
2. **`.env.local` 에 추가:**
   ```
   GEMINI_API_KEY=AIza...
   ```
3. **의존성 확인** — `@google/genai`, `sharp` 가 devDependencies 에 설치되어 있어야 함 (이미 설치됨)

### 2.2 실행

```bash
cd weatherfit

# 슬롯 목록 보기
node scripts/generate-character-asset.mjs --list

# 한 장만 (예: male-mild-v1)
node scripts/generate-character-asset.mjs male-mild-v1

# 여러 장
node scripts/generate-character-asset.mjs male-mild-v1 female-cold-v1 female-cool-v1

# 모든 슬롯 (베이스 + 상황 + 여성 v2 = 22장, 약 5–10분 소요)
node scripts/generate-character-asset.mjs --all
```

출력:
- `public/outfit/characters/{slot}.png` — Nano Banana 원본
- `public/outfit/characters/{slot}.webp` — sharp 로 quality 80 변환 (앱이 실제 사용)

### 2.3 슬롯 의상 한 줄 수정

`scripts/generate-character-asset.mjs` 의 `SLOTS` 상수에 모든 슬롯이 정의되어 있습니다. 의상을 바꾸려면 해당 키의 `outfit` 문자열만 편집한 뒤 그 슬롯만 다시 실행하세요. **STYLE LOCK 블록(파일 상단 상수)은 절대 수정하지 않습니다** — 본 스킬 §1-A 의 캐논과 동기화되어야 함.

### 2.4 결과 검수 체크리스트

생성된 PNG가 다음과 일치하지 않으면 같은 슬롯을 다시 실행합니다 (Nano Banana 는 동일 입력에도 약간씩 다른 결과를 줌):

- [ ] 얼굴·헤어가 캐논과 명확히 같은 인물로 보임
- [ ] 라인 스타일 (남자=얇은 회갈색 + 수채, 여자=얇은 검정 + 플랫 파스텔) 유지
- [ ] 풀바디 정면, 흰 배경, 그림자/바닥/텍스트/워터마크 없음
- [ ] 베이스 슬롯에 우산·모자·선글라스·가방이 섞이지 않음 (상황 슬롯은 예외)

검수 실패 시: 동일 명령 재실행 → 그래도 안 되면 `outfit` 문구를 더 구체적으로 (색·소재·길이) 보강 후 재실행.

### 2.5 폴백 — 외부 도구 수동 생성

API 키 발급이 불가하거나 결과가 만족스럽지 않으면 §1-A 의 STYLE LOCK 블록 + 슬롯 한 줄을 Google AI Studio / ChatGPT / Midjourney 웹 UI에 직접 붙여 넣고 PNG 를 다운로드, `public/outfit/characters/` 에 같은 파일명으로 저장한 뒤 §3 의 WebP 변환을 실행합니다.

---

## 3. PNG → WebP 변환 (악세사리·수동 생성 캐릭터 공용)

### 실행 방법

```bash
cd weatherfit
node scripts/convert-outfit-to-webp.mjs
```

이 스크립트는:
- `public/outfit/characters/*.png` 와 `public/outfit/accessories/*.png` 를 모두 찾아 WebP(quality 80)로 변환
- `*-v1.webp` 파일을 같은 폴더에 생성 (기존 PNG 보존)
- 이미 WebP가 존재하면 덮어씀
- 변환 전후 파일 크기를 출력

### 스크립트 수동 변환 (특정 파일만)

```bash
node -e "
const sharp = require('sharp');
sharp('public/outfit/accessories/acc-mask-v1.png')
  .webp({ quality: 80 })
  .toFile('public/outfit/accessories/acc-mask-v1.webp')
  .then(i => console.log('done', i));
"
```

---

## 3. 새 악세사리 추가 체크리스트

새 악세사리 PNG(`acc-{name}-v1.png`)를 `public/outfit/accessories/` 에 넣은 후:

1. **WebP 변환**: `node scripts/convert-outfit-to-webp.mjs`
2. **`lib/outfit/accessoryIllust.ts`**: `OUTFIT_ACCESSORY_ASSETS` 에 키·경로 추가
   ```typescript
   mask: '/outfit/accessories/acc-mask-v1.webp',
   ```
3. **`lib/outfit/outfitWeatherAccessories.ts`**: 날씨 조건별 노출 규칙 추가
4. **`docs/outfit-character-assets.md`** §3.1 표와 변경 이력 업데이트
5. `npm run build` 로 빌드 확인

---

## 4. 새 캐릭터 추가 체크리스트

새 캐릭터 PNG(`{gender}-{slot}-v1.png`)를 `public/outfit/characters/` 에 넣은 후:

1. **WebP 변환**: `node scripts/convert-outfit-to-webp.mjs`
2. **`lib/outfit/characterIllust.ts`**: `SLOT_BY_ZONE` 에서 해당 slot이 `.webp` 경로를 참조하는지 확인 (이미 자동 반영됨)
3. `npm run build` 로 빌드 확인

---

## 5. 컴포넌트 `next/image` 사용 규칙

악세사리 이미지 (크기 고정 44px):
```tsx
import Image from 'next/image'
<Image
  src={outfitAccessorySrc(key)}
  alt={alt}
  width={44}
  height={44}
  className="h-10 w-10 shrink-0 object-contain ..."
  sizes="44px"
  loading="lazy"
/>
```

캐릭터 이미지 (유동 너비):
```tsx
import Image from 'next/image'
// fluid 모드: fill + 비율 wrapper
<div style={{ position: 'relative', width: '100%', aspectRatio: '200 / 296' }}>
  <Image fill src={src} alt={alt} style={{ objectFit: 'contain' }} sizes="(max-width:640px) 100vw, 300px" />
</div>
// fixed 모드
<Image src={src} alt={alt} width={size} height={Math.round(pxH)} sizes={`${size}px`} priority />
```

---

## 6. 관련 파일 맵

| 역할 | 파일 |
|------|------|
| 자산 경로 정의 (악세사리) | `lib/outfit/accessoryIllust.ts` |
| 자산 경로 정의 (캐릭터) | `lib/outfit/characterIllust.ts` |
| 날씨 조건별 악세사리 노출 | `lib/outfit/outfitWeatherAccessories.ts` |
| 악세사리 이미지 표시 | `components/outfit/OutfitIllustPanel.tsx` |
| 캐릭터 이미지 표시 | `components/outfit/illustration/DynamicOutfitIllustration.tsx` |
| 변환 스크립트 | `scripts/convert-outfit-to-webp.mjs` |
| 스펙 문서 | `docs/outfit-character-assets.md` |

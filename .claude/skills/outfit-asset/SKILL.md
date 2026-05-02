# Skill: outfit-asset — WeatherFit 복장 자산 생성 & 최적화

## 트리거 조건

다음 중 하나에 해당하면 이 스킬을 실행합니다.

- "새 복장 추가해줘", "새 악세사리 추가해줘", "캐릭터 이미지 추가해줘"
- "PNG 최적화해줘", "WebP로 변환해줘", "이미지 압축해줘"
- "복장 자산 만들어줘", "outfit asset 추가"
- 사용자가 PNG 파일 경로를 제시하면서 앱에 적용 요청

---

## 스킬 목적

WeatherFit의 `public/outfit/` 자산을 **동일한 스타일**로 제작·변환·앱 연동하는 전 과정을 자동화합니다.

1. **스타일 가이드** — 새 PNG를 생성할 때 사용하는 프롬프트 규칙
2. **PNG → WebP 변환** — `scripts/convert-outfit-to-webp.mjs` 실행
3. **코드 연동** — `accessoryIllust.ts` / `characterIllust.ts` + 컴포넌트 업데이트

---

## 1. 자산 스타일 가이드

### 공통 스타일 (AI 이미지 생성 시 모든 프롬프트에 포함)

```
Flat 2D vector illustration, thin consistent black outlines, soft muted pastel palette,
friendly minimal mobile-app style, pure white background (#FFFFFF), no shadows,
no floor, generous margin, centered composition.
No text, no watermarks, no logos.
```

### 1-A. 전신 캐릭터 (`public/outfit/characters/`)

| 항목 | 규칙 |
|------|------|
| 파일명 | `{gender}-{slot}-v1.png` (예: `female-hot-v1.png`) |
| `gender` | `female` 또는 `male` |
| `slot` | `hot` / `warm` / `mild` / `cool` / `cold` / `freezing` |
| 구도 | 세로 풀바디, 정면 중립 포즈 |
| 복장 | 슬롯에 맞는 계절 의상. **우산·모자·선글라스·가방 없음** (베이스 캐릭터만) |
| 권장 캔버스 | 세로 비율 2:3 이상 (예: 768×1152, 1024×1536) |

객체별 추가 프롬프트 예시:

| slot | 추가 문구 |
|------|-----------|
| `hot` | light summer outfit, short sleeves, shorts or skirt |
| `warm` | casual spring outfit, light jacket or thin cardigan |
| `mild` | thin long-sleeve shirt or light sweater |
| `cool` | hoodie or light jacket, pants |
| `cold` | thick coat or puffer jacket, scarf |
| `freezing` | heavy winter coat, ear protection, layered clothing |

### 1-B. 소형 악세사리 (`public/outfit/accessories/`)

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

## 2. PNG → WebP 변환

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

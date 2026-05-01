# 복장 추천 항목 편집 카탈로그

이 문서는 앱에 표시되는 **복장 추천 항목 표시 문구**를 한곳에서 정리한 것입니다.  
**`변경 후` 열만** 원하는 문구로 고친 뒤, 채팅에서 이 파일을 참조해 *「이 문서의 변경 후 내용을 코드에 반영해줘」*라고 요청하면 됩니다.  
(`변경 전`은 참고용으로 두고, 수정하지 않는 것을 권장합니다.)

---

## 사용 방법

1. 아래 표에서 **`변경 후` 열**만 수정합니다. (처음에는 `변경 전`과 동일합니다.)
2. 수정을 마치면 Cursor 채팅에 예시처럼 요청합니다.  
   - 예: `weatherfit/docs/outfit-items-editable-catalog.md` 의 변경 후 열을 `rules.ts` / `recommender.ts` 등 해당 정의에 반영해줘.
3. 에이전트는 **`id` 컬럼**을 기준으로 코드의 `name` 필드를 업데이트합니다. `id`는 바꾸지 마세요. (바꾸면 코드 매핑이 깨질 수 있습니다.)

---

## 베이스·이너 (`category: base`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `top-thermal` | 기모 긴팔 / 상의 내복 | 기모 긴팔 / 상의 내복 |
| `bottom-leggings-thermal` | 기모 레깅스 / 하의 내복 | 기모 레깅스 / 하의 내복 |
| `top-ski-inner` | 기능성 내의 (상하) | 기능성 내의 (상하) |

---

## 상의 (`category: top`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `top-tshirt` | 밝은색 기능성 반팔 또는 얇은 긴팔 | 밝은색 기능성 반팔 또는 얇은 긴팔 |
| `top-blouse` | 반팔 또는 얇은 긴팔 / UV 가디건 | 반팔 또는 얇은 긴팔 / UV 가디건 |
| `top-shirt-light` | 얇은 반팔·긴팔 또는 카라 셔츠 | 얇은 반팔·긴팔 또는 카라 셔츠 |
| `top-blouse-warm` | 얇은 반팔·긴팔 또는 블라우스 | 얇은 반팔·긴팔 또는 블라우스 |
| `top-longsleeve` | 긴팔 티셔츠 | 긴팔 티셔츠 |
| `top-longsleeve-f` | 긴팔 티 / 얇은 니트 | 긴팔 티 / 얇은 니트 |
| `top-shirt` | 니트·맨투맨 또는 두꺼운 긴팔 *(cool 구간 남성)* | 니트·맨투맨 또는 두꺼운 긴팔 *(cool 구간 남성)* |
| `top-shirt` | 두꺼운 긴팔 셔츠 *(cold/freezing 구간 남성, 동일 id)* | 두꺼운 긴팔 셔츠 *(cold/freezing 구간 남성, 동일 id)* |
| `top-knit` | 니트·맨투맨 / 두꺼운 긴팔 *(cool 구간 여성)* | 니트·맨투맨 / 두꺼운 긴팔 *(cool 구간 여성)* |
| `top-knit` | 터틀넥 니트 / 두꺼운 긴팔 *(cold/freezing 구간 여성, 동일 id)* | 터틀넥 니트 / 두꺼운 긴팔 *(cold/freezing 구간 여성, 동일 id)* |
| `corr-uv-sleeves` | 긴팔 겉옷 또는 UV 팔토시 | 긴팔 겉옷 또는 UV 팔토시 |

> **참고:** `top-shirt`, `top-knit`은 구간에 따라 코드에 다른 `name`이 들어갑니다. 둘 다 바꾸려면 **같은 id에 대해 한 문구로 통일**할지, **구간별로 나누고 싶은지** 요청 시 에이전트에게 명시해 주세요.

---

## 미들 (`category: mid`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `mid-hoodie` | 후드 / 맨투맨 | 후드 / 맨투맨 |
| `mid-cardigan-light` | 얇은 가디건 | 얇은 가디건 |
| `mid-cardigan` | 가디건 / 맨투맨 | 가디건 / 맨투맨 |
| `mid-cardigan-f` | 롱 가디건 / 니트 조끼 | 롱 가디건 / 니트 조끼 |
| `mid-sweater` | 두꺼운 니트 / 플리스 | 두꺼운 니트 / 플리스 |
| `mid-sweater-f` | 두꺼운 니트 / 울 가디건 | 두꺼운 니트 / 울 가디건 |
| `mc-golf-windvest` | 골프 윈드 베스트 | 골프 윈드 베스트 |
| `mc-hiking-midlayer` | 얇은 플리스 / 경량 다운 (배낭에) | 얇은 플리스 / 경량 다운 (배낭에) |

---

## 아우터 (`category: outer`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `outer-jacket` | 가벼운 점퍼 / 바람막이 | 가벼운 점퍼 / 바람막이 |
| `outer-jacket-f` | 트렌치코트 / 가벼운 점퍼 | 트렌치코트 / 가벼운 점퍼 |
| `outer-coat` | 경량 패딩 / 코트 / 플리스 겉옷 | 경량 패딩 / 코트 / 플리스 겉옷 |
| `outer-coat-f` | 경량 패딩 / 코트 / 플리스 겉옷 | 경량 패딩 / 코트 / 플리스 겉옷 |
| `outer-padding` | 두꺼운 코트 또는 패딩 *(체감 0~5℃ 등)* | 두꺼운 코트 또는 패딩 *(체감 0~5℃ 등)* |
| `outer-padding` | 다운 패딩 / 헤비 패딩 *(체감 0℃ 미만, 동일 id·조건부 문구)* | 다운 패딩 / 헤비 패딩 *(체감 0℃ 미만, 동일 id·조건부 문구)* |
| `outer-ski-jacket` | 스키 재킷 (방수·방풍) | 스키 재킷 (방수·방풍) |
| `mc-river-windbreaker` | 얇은 바람막이 (강바람 대비) | 얇은 바람막이 (강바람 대비) |
| `mc-river-windbreaker-mild` | 방풍 점퍼 (강바람 대비) | 방풍 점퍼 (강바람 대비) |
| `mc-hiking-windbreaker` | 경량 바람막이 (배낭에 보관) | 경량 바람막이 (배낭에 보관) |
| `mc-beach-coverup` | 비치 커버업 / 파레오 | 비치 커버업 / 파레오 |
| `corr-wind-fives` | 얇은 바람막이 (방풍) | 얇은 바람막이 (방풍) |

> **참고:** `outer-padding`은 기온에 따라 `name`이 달라집니다. 통일하거나 분리하려면 요청 시 설명해 주세요.

---

## 하의 (`category: bottom`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `bottom-skirt-mini` | 통기성 팬츠·큐롯 / 린넨 쇼츠 | 통기성 팬츠·큐롯 / 린넨 쇼츠 |
| `bottom-dress` | 원피스 (선택) | 원피스 (선택) |
| `bottom-shorts-m` | 통기성 반바지 / 경량 팬츠 | 통기성 반바지 / 경량 팬츠 |
| `bottom-linen-pants-f` | 통기성 긴바지·레깅스 / 반바지 | 통기성 긴바지·레깅스 / 반바지 |
| `bottom-midi-skirt` | 미디스커트 (선택) | 미디스커트 (선택) |
| `bottom-wide-pants` | 와이드 팬츠 / 청바지 | 와이드 팬츠 / 청바지 |
| `bottom-midi-skirt-mild` | 미디스커트 + 스타킹 (선택) | 미디스커트 + 스타킹 (선택) |
| `bottom-pants` | 면 팬츠 / 청바지 | 면 팬츠 / 청바지 |
| `bottom-slacks-f` | 슬랙스 / 두꺼운 청바지 | 슬랙스 / 두꺼운 청바지 |
| `bottom-long-skirt` | 롱스커트 + 두꺼운 타이츠 (선택) | 롱스커트 + 두꺼운 타이츠 (선택) |
| `bottom-slacks-m` | 청바지 / 슬랙스 | 청바지 / 슬랙스 |
| `bottom-warm-pants-f` | 기모 바지 / 두꺼운 슬랙스 | 기모 바지 / 두꺼운 슬랙스 |
| `bottom-warm-pants` | 두꺼운 팬츠 / 기모 바지 | 두꺼운 팬츠 / 기모 바지 |
| `top-golf-skirt` | 골프 스커트 / 팬츠 | 골프 스커트 / 팬츠 |
| `bottom-ski-pants` | 스키 팬츠 | 스키 팬츠 |

---

## 신발 (`category: foot`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `foot-hiking` | 등산화 / 트레킹화 | 등산화 / 트레킹화 |
| `foot-sneaker` | 러닝화 / 운동화 | 러닝화 / 운동화 |
| `foot-sneaker` | 운동화 / 편한 신발 *(일반, 동일 id)* | 운동화 / 편한 신발 *(일반, 동일 id)* |
| `foot-golf` | 골프화 | 골프화 |
| `foot-sandal` | 샌들 / 아쿠아슈즈 | 샌들 / 아쿠아슈즈 |
| `foot-sandal-f` | 샌들 / 플랫슈즈 | 샌들 / 플랫슈즈 |
| `foot-boots` | 방한 부츠 | 방한 부츠 |
| `foot-boots-f` | 방한 부츠 / 앵클 부츠 | 방한 부츠 / 앵클 부츠 |
| `foot-loafer` | 로퍼 / 운동화 | 로퍼 / 운동화 |
| `rain-shoes` | 미끄럼 적은 방수 신발 | 미끄럼 적은 방수 신발 |
| `rain-boots` | 방수 신발 | 방수 신발 |
| `corr-freeze-duration-boots` | 방한화 | 방한화 |

> **참고:** `foot-sneaker`는 활동·구간에 따라 다른 문구가 붙습니다. 통일 시 요청에 적어 주세요.

---

## 액세서리 (`category: acc`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `acc-hot-hat` | 모자 | 모자 |
| `acc-hot-sunglasses` | UV 차단 선글라스 | UV 차단 선글라스 |
| `mc-beach-uvhat` | 모자 | 모자 |
| `mc-beach-suncream` | SPF50+ PA++++ 선크림 | SPF50+ PA++++ 선크림 |
| `mc-golf-armsleeve` | UV 차단 팔토시 | UV 차단 팔토시 |
| `mc-golf-coolingneck` | 쿨링 넥 게이터 | 쿨링 넥 게이터 |
| `acc-golf-hat` | 골프 모자 | 골프 모자 |
| `acc-buff` | 버프 / 등산 모자 | 버프 / 등산 모자 |
| `acc-stick` | 등산 스틱 (권장) | 등산 스틱 (권장) |
| `acc-gloves` | 장갑 | 장갑 |
| `acc-gloves-sport` | 얇은 장갑 | 얇은 장갑 |
| `acc-sunglasses` | 선글라스 | 선글라스 |
| `acc-ski-gloves` | 스키 장갑 (방수) | 스키 장갑 (방수) |
| `acc-scarf-f` | 머플러 / 숄 | 머플러 / 숄 |
| `acc-scarf` | 목도리 | 목도리 |
| `acc-beaniehat-f` | 비니 / 니트 모자 | 비니 / 니트 모자 |
| `acc-gloves-f` | 장갑 | 장갑 |
| `acc-earflap` | 귀마개 / 비니 | 귀마개 / 비니 |
| `acc-bag-f` | 에코백 / 숄더백 | 에코백 / 숄더백 |
| `acc-hat-sun-f` | 모자 | 모자 |
| `acc-hat-sun` | 모자 | 모자 |
| `acc-sunglasses-warm` | UV 차단 선글라스 | UV 차단 선글라스 |
| `acc-headband` | 헤드밴드 / 스포츠 모자 | 헤드밴드 / 스포츠 모자 |
| `corr-uv-widehat` | 모자 | 모자 |
| `corr-cold-wind-scarf` | 목도리 | 목도리 |
| `corr-cold-wind-gloves` | 장갑 | 장갑 |
| `corr-cold-wind-beanie` | 비니 / 니트 모자 | 비니 / 니트 모자 |
| `corr-freeze-duration-ear` | 귀마개 / 이어워머 | 귀마개 / 이어워머 |
| `acc-suncream` | SPF50+ 자외선 차단제 | SPF50+ 자외선 차단제 |

---

## 강수 (`category: rain`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `rain-coat` | 비옷 / 레인자켓 (낙뢰 시 우산 대신) | 비옷 / 레인자켓 (낙뢰 시 우산 대신) |
| `rain-coat` | 우의 / 레인자켓 *(동일 id)* | 우의 / 레인자켓 *(동일 id)* |
| `rain-umbrella` | 우산 | 우산 |

---

## 마스크 (`category: mask`)

| id | 변경 전 | 변경 후 |
|----|---------|---------|
| `mask-dust` | `KF80` / `KF94` 보건용 마스크 *(코드에서 등급에 따라 문자열 조합)* | `KF80` / `KF94` 보건용 마스크 *(코드에서 등급에 따라 문자열 조합)* |

> **참고:** 마스크 `name`은 `recommender.ts`에서 `` `${maskLevel} 보건용 마스크` `` 형태로 생성됩니다. 접두어(KF80/KF94)만 바꾸려면 요청에 적어 주세요.

---

## 코드 반영 위치 (에이전트용)

| 파일 | 설명 |
|------|------|
| `weatherfit/lib/outfit/rules.ts` | `getBaseItems`, `getActivityItems`, `getMicroclimateItems`의 `name` |
| `weatherfit/lib/outfit/recommender.ts` | `pushCorr`, 강수·마스크·선크림 등의 `name` |

---

## 문서 메타

- **최초 작성:** 변경 전·변경 후 동일 초기값.
- **수정 후:** 사용자가 `변경 후`만 고친 뒤, 이 파일 경로를 넣어 반영을 요청하면 됩니다.

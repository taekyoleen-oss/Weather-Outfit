import type { TempZone, OutfitItem, ActivityType, GenderType, HeroIllustKey } from '@/types/outfit'

// ─── Microclimate ────────────────────────────────────────────────────────────
// 장소별 체감온도 보정값 (°C). 강바람·고도·해풍 등으로 실제 체감이 낮아지는 차이.
const MICROCLIMATE_OFFSETS: Partial<Record<ActivityType, number>> = {
  river: -2,   // 강바람·수면 증발 냉각
  beach: -1,   // 해풍 (하지만 UV는 반대로 더 강함)
  golf:  -2,   // 탁 트인 개방지, 이른 아침 라운딩
  hiking: -2,  // 고도 상승에 따른 기온 저하
}

export function getMicroclimateOffset(activity: ActivityType): number {
  return MICROCLIMATE_OFFSETS[activity] ?? 0
}

export function getMicroclimateNote(activity: ActivityType): string | undefined {
  switch (activity) {
    case 'river':
      return '🌊 강변은 강바람과 수면 증발로 체감온도가 도심보다 2~3°C 낮아요. 방풍 소재 겉옷을 꼭 챙기세요.'
    case 'beach':
      return '🏖️ 해변은 수면 반사로 자외선이 도심보다 30~50% 강합니다. 자외선 차단에 특히 신경 쓰고, 해풍으로 생각보다 시원할 수 있어요.'
    case 'golf':
      return '⛳ 골프장은 탁 트인 개방지라 바람이 세고 체감온도가 낮아요. 이른 아침 라운딩이라면 더욱 따뜻하게 레이어링을 준비하세요.'
    case 'hiking':
      return '🏔️ 산은 100m 오를수록 약 0.6°C씩 기온이 내려가요. 정상부는 3~5°C 낮고 바람도 강하니, 배낭에 여분 레이어를 반드시 챙기세요.'
  }
  return undefined
}

// 장소 특성상 추가로 필요한 아이템 (zone 조정 외 추가 레이어)
export function getMicroclimateItems(
  activity: ActivityType,
  baseZone: TempZone,
  gender: GenderType,
): OutfitItem[] {
  const items: OutfitItem[] = []

  switch (activity) {
    case 'river':
      // warm·hot에서도 강바람 대비 방풍 필수
      if (baseZone === 'hot' || baseZone === 'warm') {
        items.push({
          id: 'mc-river-windbreaker',
          name: '얇은 바람막이 (강바람 대비)',
          icon: '💨',
          category: 'outer',
          required: true,
          condition: '강변 강풍·체감온도 저하 대비',
          activityTag: '강변',
        })
      }
      // mild에서도 방풍 점퍼 권장
      if (baseZone === 'mild') {
        items.push({
          id: 'mc-river-windbreaker-mild',
          name: '방풍 점퍼 (강바람 대비)',
          icon: '💨',
          category: 'outer',
          required: true,
          condition: '강변 강풍 체감온도 대비',
          activityTag: '강변',
        })
      }
      break

    case 'golf':
      if (baseZone === 'hot' || baseZone === 'warm') {
        items.push({
          id: 'mc-golf-armsleeve',
          name: 'UV 차단 팔토시',
          icon: '🧴',
          category: 'acc',
          required: false,
          condition: '개방 잔디밭 직사광선·자외선 차단',
          activityTag: '골프 전용',
        })
        items.push({
          id: 'mc-golf-coolingneck',
          name: '쿨링 넥 게이터',
          icon: '🧣',
          category: 'acc',
          required: false,
          condition: '목·얼굴 자외선·열 차단',
          activityTag: '골프 전용',
        })
      }
      if (baseZone === 'mild' || baseZone === 'cool') {
        items.push({
          id: 'mc-golf-windvest',
          name: '골프 윈드 베스트',
          icon: '🧥',
          category: 'mid',
          required: false,
          condition: '이른 라운딩 아침 한기 대비',
          activityTag: '골프 전용',
        })
      }
      break

    case 'beach':
      // 해변 자외선은 항상 강하므로 API 수치 무관하게 필수 추가
      items.push({
        id: 'mc-beach-uvhat',
        name: '모자',
        icon: '👒',
        category: 'acc',
        required: true,
        condition: '수면 반사 자외선 차단 필수',
        activityTag: '해변 전용',
      })
      items.push({
        id: 'mc-beach-suncream',
        name: 'SPF50+ PA++++ 선크림',
        icon: '🧴',
        category: 'acc',
        required: true,
        condition: '2시간마다 덧발라주세요',
        activityTag: '해변 전용',
      })
      if (gender === 'female') {
        items.push({
          id: 'mc-beach-coverup',
          name: '비치 커버업 / 파레오',
          icon: '👗',
          category: 'outer',
          required: false,
          condition: '이동 시 자외선·모래 차단',
          activityTag: '해변 전용',
        })
      }
      break

    case 'hiking':
      // warm·mild에서도 정상 대비 경량 바람막이 필수
      if (baseZone === 'hot' || baseZone === 'warm' || baseZone === 'mild') {
        items.push({
          id: 'mc-hiking-windbreaker',
          name: '경량 바람막이 (배낭에 보관)',
          icon: '🏔️',
          category: 'outer',
          required: true,
          condition: '정상부 기온 저하·강풍 대비',
          activityTag: '등산 전용',
        })
        items.push({
          id: 'mc-hiking-midlayer',
          name: '얇은 플리스 / 경량 다운 (배낭에)',
          icon: '🎒',
          category: 'mid',
          required: false,
          condition: '정상 체온 유지·비상용',
          activityTag: '등산 전용',
        })
      }
      break
  }

  return items
}

/**
 * 체감(°C) 구간 — 공용 기준표와 동일 경계: 28 / 23 / 18 / 12 / 6 / 0
 * - freezing: 0~5℃ 및 0℃ 미만(세부 외피는 feelsLike로 getBaseItems에서 구분)
 */
export function getTempZone(feelsLike: number): TempZone {
  if (feelsLike >= 28) return 'hot'
  if (feelsLike >= 23) return 'warm'
  if (feelsLike >= 18) return 'mild'
  if (feelsLike >= 12) return 'cool'
  if (feelsLike >= 6) return 'cold'
  return 'freezing'
}

export const TEMP_ZONE_LABELS: Record<TempZone, string> = {
  hot: '덥다! 가볍게',
  warm: '따뜻해요',
  mild: '선선해요',
  cool: '쌀쌀해요',
  cold: '추워요',
  freezing: '매우 추워요',
}

export const LAYER_LEVELS: Record<TempZone, number> = {
  hot: 1,
  warm: 1,
  mild: 2,
  cool: 2,
  cold: 3,
  freezing: 3,
}

// Base outfit items by temperature zone and gender
/** feelsLike: 구간 판정에 쓴 체감(미기후 보정 포함). freezing(0~5·영하) 외피 세분화용 */
export function getBaseItems(
  zone: TempZone,
  gender: GenderType,
  activity: ActivityType,
  feelsLike?: number
): OutfitItem[] {
  const items: OutfitItem[] = []

  // BASE layer (이너) — 6℃ 미만만 보온 이너 필수(표: 6~11, 0~5, 영하)
  if (zone === 'cold' || zone === 'freezing') {
    items.push({ id: 'top-thermal', name: '기모 긴팔 / 상의 내복', icon: '🧣', category: 'base', required: true })
    if (gender === 'female') {
      items.push({ id: 'bottom-leggings-thermal', name: '기모 레깅스 / 하의 내복', icon: '🩱', category: 'base', required: zone === 'freezing' })
    }
  }
  // 12~17℃(cool): 표에 이너 없음 — 기존 선택 기모 제거

  // TOP layer — 가이드 라.2: 28℃+ 반팔·얇은 긴팔 / 23~27℃ 얇은 반팔·긴팔·셔츠
  if (zone === 'hot') {
    if (gender === 'male') {
      items.push({ id: 'top-tshirt', name: '밝은색 기능성 반팔 또는 얇은 긴팔', icon: '👕', category: 'top', required: true })
    } else {
      items.push({ id: 'top-blouse', name: '반팔 또는 얇은 긴팔 / UV 가디건', icon: '👚', category: 'top', required: true })
    }
    // 골프·해변·스키는 활동 전용 모자·선글라스가 별도로 있음
    if (activity !== 'golf' && activity !== 'beach' && activity !== 'ski') {
      items.push({ id: 'acc-hot-hat', name: '모자', icon: '🧢', category: 'acc', required: true })
      items.push({ id: 'acc-hot-sunglasses', name: 'UV 차단 선글라스', icon: '🕶️', category: 'acc', required: true })
    }
  } else if (zone === 'warm') {
    if (gender === 'male') {
      items.push({ id: 'top-shirt-light', name: '얇은 반팔·긴팔 또는 카라 셔츠', icon: '👕', category: 'top', required: true })
    } else {
      items.push({ id: 'top-blouse-warm', name: '얇은 반팔·긴팔 또는 블라우스', icon: '👚', category: 'top', required: true })
    }
  } else if (zone === 'mild') {
    if (gender === 'male') {
      items.push({ id: 'top-longsleeve', name: '긴팔 티셔츠', icon: '👕', category: 'top', required: true })
    } else {
      items.push({ id: 'top-longsleeve-f', name: '긴팔 티 / 얇은 니트', icon: '👚', category: 'top', required: true })
    }
  } else if (zone === 'cool') {
    if (gender === 'male') {
      items.push({ id: 'top-shirt', name: '니트·맨투맨 또는 두꺼운 긴팔', icon: '👕', category: 'top', required: true })
    } else {
      items.push({ id: 'top-knit', name: '니트·맨투맨 / 두꺼운 긴팔', icon: '👚', category: 'top', required: true })
    }
  } else {
    // cold / freezing
    if (gender === 'male') {
      items.push({ id: 'top-shirt', name: '두꺼운 긴팔 셔츠', icon: '👕', category: 'top', required: true })
    } else {
      items.push({ id: 'top-knit', name: '터틀넥 니트 / 두꺼운 긴팔', icon: '👚', category: 'top', required: true })
    }
  }

  // MID layer
  if (zone === 'mild') {
    if (gender === 'male') {
      items.push({ id: 'mid-hoodie', name: '후드 / 맨투맨', icon: '🧥', category: 'mid', required: false, condition: '아침저녁 쌀쌀할 때' })
    } else {
      items.push({ id: 'mid-cardigan-light', name: '얇은 가디건', icon: '🧥', category: 'mid', required: false, condition: '아침저녁 쌀쌀할 때' })
    }
  } else if (zone === 'cool') {
    if (gender === 'male') {
      items.push({ id: 'mid-cardigan', name: '가디건 / 맨투맨', icon: '🧥', category: 'mid', required: true })
    } else {
      items.push({ id: 'mid-cardigan-f', name: '롱 가디건 / 니트 조끼', icon: '🧥', category: 'mid', required: true })
    }
  } else if (zone === 'cold' || zone === 'freezing') {
    if (gender === 'male') {
      items.push({ id: 'mid-sweater', name: '두꺼운 니트 / 플리스', icon: '🧥', category: 'mid', required: true })
    } else {
      items.push({ id: 'mid-sweater-f', name: '두꺼운 니트 / 울 가디건', icon: '🧥', category: 'mid', required: true })
    }
  }

  // OUTER layer
  if (zone === 'cool') {
    if (gender === 'male') {
      items.push({ id: 'outer-jacket', name: '가벼운 점퍼 / 바람막이', icon: '🧥', category: 'outer', required: true })
    } else {
      items.push({ id: 'outer-jacket-f', name: '트렌치코트 / 가벼운 점퍼', icon: '🧥', category: 'outer', required: true })
    }
  } else if (zone === 'cold') {
    if (gender === 'male') {
      items.push({ id: 'outer-coat', name: '경량 패딩 / 코트 / 플리스 겉옷', icon: '🧥', category: 'outer', required: true })
    } else {
      items.push({ id: 'outer-coat-f', name: '경량 패딩 / 코트 / 플리스 겉옷', icon: '🧥', category: 'outer', required: true })
    }
  } else if (zone === 'freezing') {
    const subzero = feelsLike !== undefined && feelsLike < 0
    items.push({
      id: 'outer-padding',
      name: subzero ? '다운 패딩 / 헤비 패딩' : '두꺼운 코트 또는 패딩',
      icon: '🥶',
      category: 'outer',
      required: true,
      condition: subzero ? '0℃ 미만 — 한파·강풍 시 장시간 야외 자제' : '0~5℃ 구간',
    })
  }

  // BOTTOM
  if (zone === 'hot') {
    if (gender === 'female') {
      items.push({ id: 'bottom-skirt-mini', name: '통기성 팬츠·큐롯 / 린넨 쇼츠', icon: '👖', category: 'bottom', required: true })
      items.push({ id: 'bottom-dress', name: '원피스 (선택)', icon: '👗', category: 'bottom', required: false, condition: '원피스로 대체 가능' })
    } else {
      items.push({ id: 'bottom-shorts-m', name: '통기성 반바지 / 경량 팬츠', icon: '🩳', category: 'bottom', required: true })
    }
  } else if (zone === 'warm') {
    if (gender === 'female') {
      items.push({ id: 'bottom-linen-pants-f', name: '통기성 긴바지·레깅스 / 반바지', icon: '👖', category: 'bottom', required: true })
      items.push({ id: 'bottom-midi-skirt', name: '미디스커트 (선택)', icon: '👗', category: 'bottom', required: false, condition: '스커트로 대체 가능' })
    } else {
      items.push({ id: 'bottom-shorts-m', name: '통기성 긴바지 또는 반바지', icon: '🩳', category: 'bottom', required: true })
    }
  } else if (zone === 'mild') {
    if (gender === 'female') {
      items.push({ id: 'bottom-wide-pants', name: '와이드 팬츠 / 청바지', icon: '👖', category: 'bottom', required: true })
      items.push({ id: 'bottom-midi-skirt-mild', name: '미디스커트 + 스타킹 (선택)', icon: '👗', category: 'bottom', required: false, condition: '스커트 착용 시 스타킹 필수' })
    } else {
      items.push({ id: 'bottom-pants', name: '면 팬츠 / 청바지', icon: '👖', category: 'bottom', required: true })
    }
  } else if (zone === 'cool') {
    if (gender === 'female') {
      items.push({ id: 'bottom-slacks-f', name: '슬랙스 / 두꺼운 청바지', icon: '👖', category: 'bottom', required: true })
      items.push({ id: 'bottom-long-skirt', name: '롱스커트 + 두꺼운 타이츠 (선택)', icon: '👗', category: 'bottom', required: false, condition: '스커트 착용 시 타이츠 필수' })
    } else {
      items.push({ id: 'bottom-slacks-m', name: '청바지 / 슬랙스', icon: '👖', category: 'bottom', required: true })
    }
  } else {
    // cold / freezing
    if (gender === 'female') {
      items.push({ id: 'bottom-warm-pants-f', name: '기모 바지 / 두꺼운 슬랙스', icon: '👖', category: 'bottom', required: true })
    } else {
      items.push({ id: 'bottom-warm-pants', name: '두꺼운 팬츠 / 기모 바지', icon: '👖', category: 'bottom', required: true })
    }
  }

  // FOOT (activity-specific shoes)
  const shoes = getShoes(activity, zone, gender)
  items.push(shoes)

  return items
}

function getShoes(activity: ActivityType, zone: TempZone, gender: GenderType = 'male'): OutfitItem {
  if (activity === 'hiking') return { id: 'foot-hiking', name: '등산화 / 트레킹화', icon: '🥾', category: 'foot', required: true }
  if (activity === 'running' || activity === 'cycling') return { id: 'foot-sneaker', name: '러닝화 / 운동화', icon: '👟', category: 'foot', required: true }
  if (activity === 'golf') return { id: 'foot-golf', name: '골프화', icon: '👞', category: 'foot', required: true }
  if (activity === 'beach') return { id: 'foot-sandal', name: '샌들 / 아쿠아슈즈', icon: '🩴', category: 'foot', required: true }
  if (activity === 'ski') return { id: 'foot-boots', name: '방한 부츠', icon: '🥾', category: 'foot', required: true }
  if (zone === 'cold' || zone === 'freezing') {
    if (gender === 'female') return { id: 'foot-boots-f', name: '방한 부츠 / 앵클 부츠', icon: '🥾', category: 'foot', required: true }
    return { id: 'foot-boots', name: '방한 부츠', icon: '🥾', category: 'foot', required: true }
  }
  if (zone === 'cool') {
    if (gender === 'female') return { id: 'foot-loafer', name: '로퍼 / 운동화', icon: '👞', category: 'foot', required: true }
    return { id: 'foot-sneaker', name: '운동화 / 편한 신발', icon: '👟', category: 'foot', required: true }
  }
  if ((zone === 'hot' || zone === 'warm') && gender === 'female') {
    return { id: 'foot-sandal-f', name: '샌들 / 플랫슈즈', icon: '🩴', category: 'foot', required: true }
  }
  return { id: 'foot-sneaker', name: '운동화 / 편한 신발', icon: '👟', category: 'foot', required: true }
}

const ACTIVITY_TAGS: Partial<Record<ActivityType, string>> = {
  running: '달리기 전용',
  cycling: '자전거 전용',
  golf: '골프 전용',
  hiking: '등산 전용',
  beach: '해변 전용',
  ski: '스키 전용',
  tennis: '테니스 전용',
}

function tag(activity: ActivityType): string | undefined {
  return ACTIVITY_TAGS[activity]
}

// Activity-specific additional items
export function getActivityItems(activity: ActivityType, zone: TempZone, gender: GenderType): OutfitItem[] {
  const items: OutfitItem[] = []
  const activityTag = tag(activity)

  switch (activity) {
    case 'golf':
      items.push({ id: 'acc-golf-hat', name: '골프 모자', icon: '🧢', category: 'acc', required: true, activityTag })
      if (gender === 'female') items.push({ id: 'top-golf-skirt', name: '골프 스커트 / 팬츠', icon: '🩺', category: 'bottom', required: false, activityTag })
      break
    case 'hiking':
      items.push({ id: 'acc-buff', name: '버프 / 등산 모자', icon: '🧢', category: 'acc', required: false, activityTag })
      items.push({ id: 'acc-stick', name: '등산 스틱 (권장)', icon: '🏔️', category: 'acc', required: false, condition: '무릎 보호', activityTag })
      if (zone === 'cold' || zone === 'freezing') {
        items.push({ id: 'acc-gloves', name: '장갑', icon: '🧤', category: 'acc', required: true, activityTag })
      }
      break
    case 'running':
    case 'cycling':
      items.push({ id: 'acc-headband', name: '헤드밴드 / 스포츠 모자', icon: '🎽', category: 'acc', required: false, activityTag })
      if (zone === 'cold' || zone === 'freezing') {
        items.push({ id: 'acc-gloves-sport', name: '얇은 장갑', icon: '🧤', category: 'acc', required: true, activityTag })
        items.push({ id: 'acc-neckwarmer', name: '넥워머', icon: '🧣', category: 'acc', required: false, activityTag })
      }
      break
    case 'beach':
      items.push({ id: 'acc-sunglasses', name: '선글라스', icon: '🕶️', category: 'acc', required: true, activityTag })
      break
    case 'ski':
      items.push({ id: 'top-ski-inner', name: '기능성 내의 (상하)', icon: '🎿', category: 'base', required: true, activityTag })
      items.push({ id: 'outer-ski-jacket', name: '스키 재킷 (방수·방풍)', icon: '🎿', category: 'outer', required: true, activityTag })
      items.push({ id: 'bottom-ski-pants', name: '스키 팬츠', icon: '🎿', category: 'bottom', required: true, activityTag })
      items.push({ id: 'acc-ski-gloves', name: '스키 장갑 (방수)', icon: '🧤', category: 'acc', required: true, activityTag })
      break
  }

  // Cold weather accessories
  if ((zone === 'cold' || zone === 'freezing') && activity !== 'ski') {
    if (gender === 'female') {
      items.push({ id: 'acc-scarf-f', name: '머플러 / 숄', icon: '🧣', category: 'acc', required: zone === 'freezing' })
    } else {
      items.push({ id: 'acc-scarf', name: '목도리', icon: '🧣', category: 'acc', required: zone === 'freezing' })
    }
    if (zone === 'freezing') {
      if (gender === 'female') {
        items.push({ id: 'acc-beaniehat-f', name: '비니 / 니트 모자', icon: '🎓', category: 'acc', required: true })
        items.push({ id: 'acc-gloves-f', name: '장갑', icon: '🧤', category: 'acc', required: true })
      } else {
        items.push({ id: 'acc-earflap', name: '귀마개 / 비니', icon: '🎓', category: 'acc', required: true })
        items.push({ id: 'acc-gloves', name: '장갑', icon: '🧤', category: 'acc', required: true })
      }
    }
  }

  // Cool weather accessories
  if (zone === 'cool' && gender === 'female') {
    items.push({ id: 'acc-bag-f', name: '에코백 / 숄더백', icon: '👜', category: 'acc', required: false, condition: '스타일 포인트' })
  }

  // 따뜻한 구간: 가이드 라.2는 23~27℃에 모자 필수는 아님 — UV 높을 때만 권장 (28℃+는 getBaseItems)
  if (zone === 'warm') {
    if (gender === 'female') {
      items.push({ id: 'acc-hat-sun-f', name: '모자', icon: '👒', category: 'acc', required: false, condition: 'UV 3 이상 권장' })
    } else {
      items.push({ id: 'acc-hat-sun', name: '모자', icon: '👒', category: 'acc', required: false, condition: 'UV 3 이상 권장' })
    }
    items.push({ id: 'acc-sunglasses-warm', name: 'UV 차단 선글라스', icon: '🕶️', category: 'acc', required: false, condition: '자외선 높을 때' })
  }

  return items
}

// Hero illustration selector
export function pickHeroIllust(zone: TempZone, activity: ActivityType, ptyCode: string): HeroIllustKey {
  if (ptyCode === '3' || ptyCode === '2') return 'snow-gear'
  if (ptyCode === '1' || ptyCode === '4') return 'rain-gear'
  if (activity === 'ski') return 'ski-look'
  if (activity === 'beach') return 'beach-look'
  if (activity === 'golf') return 'golf-look'
  if (zone === 'hot' && (activity === 'running' || activity === 'cycling')) return 'summer-sport'
  if (zone === 'hot' || zone === 'warm') return 'summer-light'
  if (zone === 'mild') return 'spring-mild'
  if (zone === 'cool') return 'fall-layered'
  return 'winter-heavy'
}

// Tips generator — weather-outdoor-clothing-guide.md 다·사
export function generateTips(
  zone: TempZone,
  uvIndex: number,
  dustGrade: string,
  windSpeed: number,
  activity: ActivityType,
  terrain: string,
  duration: number,
  precipitation: number = 0,
  feelsLike: number = 20,
  humidity?: number,
  temperature?: number,
  o3Grade?: string,
): string[] {
  const tips: string[] = []
  const tempForHumid = temperature ?? feelsLike

  // UV tips (기상청 생활기상지수 — 가이드 다.1)
  if (uvIndex >= 11) {
    tips.push('☀️ 자외선 위험 (UV ' + uvIndex + '): 가능한 실내에 머무르세요. 외출 시 긴 소매·모자·선글라스·SPF50+ 선크림이 필요합니다.')
  } else if (uvIndex >= 8) {
    tips.push('☀️ 자외선 매우높음 (UV ' + uvIndex + '): 오전 10시~오후 3시 외출을 피하고, 긴 소매·모자·선글라스·선크림을 갖추세요.')
  } else if (uvIndex >= 6) {
    tips.push('🌡️ 오늘은 자외선이 강합니다. 긴팔 또는 팔토시, 모자, UV 차단 선글라스, 자외선 차단제가 필요합니다. (가이드 사)')
  } else if (uvIndex >= 3) {
    tips.push('💡 UV ' + uvIndex + ': 모자·선글라스·자외선 차단제를 챙겨 두세요. (기상청 생활기상지수)')
  }

  // Dust tips (에어코리아 미세먼지 행동요령 기준)
  if (dustGrade === '4') {
    tips.push('😷 미세먼지 매우나쁨: KF94 마스크 필수. 야외 운동(조깅·등산·자전거)을 중단하고 실내에 머무세요.')
  } else if (dustGrade === '3') {
    tips.push('😷 미세먼지가 나쁩니다. 보건용 마스크를 준비하고 조깅, 등산, 자전거처럼 숨이 많이 차는 활동은 줄이세요. (가이드 사)')
  }

  // 오존 나쁨 이상 — 가이드 다.3·사 (assessDanger와 보완)
  if (o3Grade === '4') {
    tips.push('⚗️ 오존 매우나쁨: 실외활동을 최소화하고 실내생활이 권고됩니다. (에어코리아)')
  } else if (o3Grade === '3') {
    tips.push('⚗️ 오존이 높습니다. 한낮 장시간 운동은 피하고, 아침이나 저녁으로 활동 시간을 조정하세요. (가이드 사)')
  } else if ((zone === 'hot' || zone === 'warm' || zone === 'mild') && ['running', 'cycling', 'tennis', 'hiking', 'golf'].includes(activity)) {
    // 오존 피크 시간대 — 수치는 양호해도 시간대 안내 (가이드 다.3)
    tips.push('⏰ 오존 피크 시간(오전 10시~오후 4시): 고강도 야외 운동은 이른 아침·저녁으로 조정하면 더 안전합니다. (에어코리아 오존 행동요령)')
  }

  // 23~27℃ + 미세먼지·오존 나쁨 — 가이드 라.2 보정
  if (
    zone === 'warm' &&
    (dustGrade === '3' || dustGrade === '4' || o3Grade === '3' || o3Grade === '4')
  ) {
    tips.push('🌡️ 체감이 따뜻한 날 대기질이 나쁩니다. 격한 운동을 줄이고 마스크 또는 활동 시간 조정을 검토하세요. (가이드 라.2)')
  }

  // Heat / humidity tips (기상청 폭염 기준 + CDC 권고)
  if (feelsLike >= 38) {
    tips.push('🥵 체감온도 ' + Math.round(feelsLike) + '°C: 한낮 야외활동을 즉시 중단하세요. CDC 권고: 밝은색 헐렁한 옷·그늘·수분 섭취.')
  } else if (feelsLike >= 33) {
    tips.push('☀️ 체감온도 ' + Math.round(feelsLike) + '°C: 수시로 물을 마시고 장시간 야외활동을 자제하세요. 통기성 밝은색 의류를 선택하세요.')
  } else if (feelsLike >= 29) {
    tips.push('🌡️ 체감온도 ' + Math.round(feelsLike) + '°C: 통기성이 좋은 옷과 충분한 수분 섭취, 그늘 휴식이 필요합니다.')
  }

  // 고온·고습 — 가이드 다.3 보정 (습도 70%↑ & 25℃↑)
  if (humidity !== undefined && humidity >= 70 && tempForHumid >= 25) {
    tips.push('💧 습도 ' + Math.round(humidity) + '%·기온 ' + Math.round(tempForHumid) + '°C: 땀이 잘 마르는 기능성 소재와 여벌 상의를 추천합니다. (가이드 다.3)')
  }

  // Cold tips (기상청 한파 행동요령 + 미국 기상청 Wind Chill + 가이드 사)
  if (zone === 'freezing') {
    if (windSpeed >= 5) {
      tips.push('🥶 강풍+혹한: 바람이 노출 피부 열손실을 키웁니다. 목도리·모자·장갑으로 노출부를 완전히 덮어야 합니다. (기상청 한파 행동요령)')
    } else {
      tips.push('❄️ 노출 부위 보온이 중요합니다. 내복, 목도리, 모자, 장갑, 방한화를 준비하고 장시간 야외활동은 피하세요. (가이드 사)')
    }
  } else if (zone === 'cold') {
    tips.push('❄️ 추운 날씨: 보온 이너와 겉옷을 겹쳐 입고, 바람이 세면 목도리·장갑·비니를 추가하세요. (가이드 라.2)')
  }

  // Wind tips (기상청 강풍 행동요령 기준)
  if (windSpeed >= 14) {
    tips.push('💨 강풍주의보 수준 (풍속 ' + windSpeed.toFixed(0) + 'm/s): 우산 대신 방수 재킷을 착용하고 낙하물 위험 구역을 피하세요.')
  } else if (windSpeed >= 5) {
    tips.push('💨 바람 ' + windSpeed.toFixed(0) + 'm/s: 얇은 방풍 외피를 챙기고, 모자는 턱끈 또는 깊은 형태가 좋습니다.')
  }

  // Temperature gap tips
  if (zone === 'mild' || zone === 'cool') {
    tips.push('🌡️ 아침·저녁 기온차가 있어요. 벗고 입기 쉬운 겉옷을 꼭 챙기세요.')
  }

  // Rain tips
  if (precipitation >= 15) {
    tips.push('🌧️ 호우 주의: 등산·강변·야영 활동은 중단하고 안전한 곳으로 이동하세요. (기상청 호우 행동요령)')
  } else if (precipitation >= 1) {
    tips.push('☂️ 비: 우산 또는 방수 재킷, 미끄럼 적은 신발을 준비하세요.')
  }

  // Activity duration tips
  if (duration >= 4 && uvIndex >= 3) {
    tips.push('⏱️ 장시간 야외 활동 시 자외선 차단제를 2시간마다 덧바르세요. (미국 피부과학회 AAD)')
  }

  // Activity-specific tips
  if (activity === 'river') {
    tips.push('🌊 강변: 강바람·수면 증발로 체감온도가 도심보다 2~3°C 낮습니다. 방풍 겉옷을 반드시 챙기세요.')
    if (uvIndex >= 3) tips.push('☀️ 수면 반사로 강변 자외선이 도심보다 강합니다. 선크림과 모자를 챙기세요. (US EPA)')
  }
  if (activity === 'beach') {
    tips.push('🏖️ 해변 자외선은 수면 반사로 도심보다 30~50% 강합니다. SPF50+ 선크림을 2시간마다 덧발라주세요. (US EPA)')
    tips.push('👕 모래·바닷물로 의류 손상이 빠릅니다. 여벌 옷과 래시가드를 준비하세요.')
  }
  if (activity === 'hiking') {
    tips.push('🏔️ 등산: 100m 오를수록 약 0.6°C 기온 저하. 정상부는 3~5°C 낮고 바람이 강합니다. 배낭에 여분 레이어를 챙기세요.')
    if (precipitation > 0) tips.push('⛈️ 비·번개 시 즉시 하산하고 계곡·능선·정상 접근을 금지합니다. (기상청 낙뢰 행동요령)')
  }
  if (activity === 'golf') {
    if (zone === 'mild' || zone === 'cool') {
      tips.push('⛳ 이른 아침 라운딩은 기온이 낮습니다. 윈드 베스트 등 보온 레이어를 준비하세요.')
    } else {
      tips.push('⛳ 골프장은 탁 트인 개방지라 자외선이 강합니다. UV 팔토시·모자를 챙기세요.')
    }
    tips.push('⚡ 낙뢰 예상 시 골프채를 즉시 내려놓고 클럽하우스나 차량으로 대피하세요. (기상청 낙뢰 행동요령)')
  }
  if (activity === 'running' || activity === 'cycling') {
    if (dustGrade === '3' || dustGrade === '4') {
      tips.push('😷 미세먼지 높을 때 조깅·자전거는 호흡량을 크게 늘립니다. 실내 운동으로 전환하세요. (에어코리아)')
    }
  }

  return tips.slice(0, 6) // 최대 6개
}

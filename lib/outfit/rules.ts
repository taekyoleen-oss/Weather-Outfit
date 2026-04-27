import type { TempZone, OutfitItem, ActivityType, GenderType, HeroIllustKey } from '@/types/outfit'

export function getTempZone(feelsLike: number): TempZone {
  if (feelsLike >= 28) return 'hot'
  if (feelsLike >= 23) return 'warm'
  if (feelsLike >= 17) return 'mild'
  if (feelsLike >= 12) return 'cool'
  if (feelsLike >= 5) return 'cold'
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
export function getBaseItems(zone: TempZone, gender: GenderType, activity: ActivityType): OutfitItem[] {
  const items: OutfitItem[] = []

  // BASE layer (이너)
  if (zone === 'cold' || zone === 'freezing') {
    items.push({ id: 'top-thermal', name: '기모 긴팔 / 상의 내복', icon: '🧣', category: 'base', required: true })
    if (gender === 'female') {
      items.push({ id: 'bottom-leggings-thermal', name: '기모 레깅스 / 하의 내복', icon: '🩱', category: 'base', required: zone === 'freezing' })
    }
  } else if (zone === 'cool') {
    items.push({ id: 'top-thermal', name: '기모 긴팔 / 내복', icon: '🧣', category: 'base', required: false, condition: '체감 온도가 낮을 때' })
  }

  // TOP layer
  if (zone === 'hot' || zone === 'warm') {
    if (gender === 'male') {
      items.push({ id: 'top-tshirt', name: '반팔 티셔츠', icon: '👕', category: 'top', required: true })
    } else {
      items.push({ id: 'top-blouse', name: '반팔 블라우스 / 크롭 티', icon: '👚', category: 'top', required: true })
    }
  } else if (zone === 'mild') {
    if (gender === 'male') {
      items.push({ id: 'top-longsleeve', name: '긴팔 티셔츠', icon: '👕', category: 'top', required: true })
    } else {
      items.push({ id: 'top-longsleeve-f', name: '긴팔 티 / 얇은 니트', icon: '👚', category: 'top', required: true })
    }
  } else {
    // cool / cold / freezing
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
      items.push({ id: 'outer-coat', name: '코트 / 두꺼운 점퍼', icon: '🧥', category: 'outer', required: true })
    } else {
      items.push({ id: 'outer-coat-f', name: '롱코트 / 울 코트', icon: '🧥', category: 'outer', required: true })
    }
  } else if (zone === 'freezing') {
    items.push({ id: 'outer-padding', name: '패딩 점퍼', icon: '🥶', category: 'outer', required: true })
  }

  // BOTTOM
  if (zone === 'hot') {
    if (gender === 'female') {
      items.push({ id: 'bottom-skirt-mini', name: '미니스커트 / 린넨 쇼츠', icon: '🩱', category: 'bottom', required: true })
      items.push({ id: 'bottom-dress', name: '원피스 (선택)', icon: '👗', category: 'bottom', required: false, condition: '원피스로 대체 가능' })
    } else {
      items.push({ id: 'bottom-shorts-m', name: '반바지 / 면 팬츠', icon: '🩳', category: 'bottom', required: true })
    }
  } else if (zone === 'warm') {
    if (gender === 'female') {
      items.push({ id: 'bottom-linen-pants-f', name: '린넨 팬츠 / 와이드 팬츠', icon: '👖', category: 'bottom', required: true })
      items.push({ id: 'bottom-midi-skirt', name: '미디스커트 (선택)', icon: '👗', category: 'bottom', required: false, condition: '스커트로 대체 가능' })
    } else {
      items.push({ id: 'bottom-shorts-m', name: '면 팬츠 / 반바지', icon: '🩳', category: 'bottom', required: true })
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
  if (activity === 'ski') return { id: 'foot-ski', name: '스키화 (렌탈 포함)', icon: '⛷️', category: 'foot', required: true }
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

// Activity-specific additional items
export function getActivityItems(activity: ActivityType, zone: TempZone, gender: GenderType): OutfitItem[] {
  const items: OutfitItem[] = []

  switch (activity) {
    case 'golf':
      items.push({ id: 'acc-golf-hat', name: '골프 모자', icon: '🧢', category: 'acc', required: true })
      items.push({ id: 'acc-golf-glove', name: '골프 장갑', icon: '🧤', category: 'acc', required: true })
      if (gender === 'female') items.push({ id: 'top-golf-skirt', name: '골프 스커트 / 팬츠', icon: '🩺', category: 'bottom', required: false })
      break
    case 'hiking':
      items.push({ id: 'acc-buff', name: '버프 / 등산 모자', icon: '🧢', category: 'acc', required: false })
      items.push({ id: 'acc-stick', name: '등산 스틱 (권장)', icon: '🏔️', category: 'acc', required: false, condition: '무릎 보호' })
      if (zone === 'cold' || zone === 'freezing') {
        items.push({ id: 'acc-gloves', name: '장갑', icon: '🧤', category: 'acc', required: true })
      }
      break
    case 'running':
    case 'cycling':
      items.push({ id: 'acc-headband', name: '헤드밴드 / 스포츠 모자', icon: '🎽', category: 'acc', required: false })
      if (zone === 'cold' || zone === 'freezing') {
        items.push({ id: 'acc-gloves-sport', name: '얇은 장갑', icon: '🧤', category: 'acc', required: true })
        items.push({ id: 'acc-neckwarmer', name: '넥워머', icon: '🧣', category: 'acc', required: false })
      }
      break
    case 'beach':
      items.push({ id: 'acc-sunglasses', name: '선글라스', icon: '🕶️', category: 'acc', required: true })
      items.push({ id: 'top-swimsuit', name: '수영복', icon: '🩱', category: 'top', required: true })
      items.push({ id: 'acc-rashguard', name: '래쉬가드', icon: '🩱', category: 'top', required: false })
      break
    case 'ski':
      items.push({ id: 'top-ski-inner', name: '기능성 내의 (상하)', icon: '🎿', category: 'base', required: true })
      items.push({ id: 'outer-ski-jacket', name: '스키 재킷 (방수·방풍)', icon: '🎿', category: 'outer', required: true })
      items.push({ id: 'bottom-ski-pants', name: '스키 팬츠', icon: '🎿', category: 'bottom', required: true })
      items.push({ id: 'acc-helmet', name: '헬멧 (안전 필수)', icon: '⛷️', category: 'acc', required: true })
      items.push({ id: 'acc-goggles', name: '스키 고글', icon: '🥽', category: 'acc', required: true })
      items.push({ id: 'acc-ski-gloves', name: '스키 장갑 (방수)', icon: '🧤', category: 'acc', required: true })
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

  // Warm weather accessories
  if (zone === 'hot' || zone === 'warm') {
    if (gender === 'female') {
      items.push({ id: 'acc-hat-sun-f', name: '챙 넓은 모자 / 버킷햇', icon: '👒', category: 'acc', required: false, condition: 'UV 차단 + 스타일' })
    } else {
      items.push({ id: 'acc-hat-sun', name: '챙 넓은 모자', icon: '👒', category: 'acc', required: false, condition: 'UV 지수 높을 때' })
    }
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

// Tips generator
export function generateTips(
  zone: TempZone,
  uvIndex: number,
  dustGrade: string,
  windSpeed: number,
  activity: ActivityType,
  terrain: string,
  duration: number
): string[] {
  const tips: string[] = []

  // UV tips
  if (uvIndex >= 6) tips.push('🌡 자외선 지수가 높습니다. SPF 50+ 선크림을 바르세요.')
  if (uvIndex >= 8) tips.push('☀️ 자외선 매우 강함. 챙 넓은 모자와 UV 차단 의류를 착용하세요.')

  // Dust tips
  if (dustGrade === '3') tips.push('😷 미세먼지 나쁨. 마스크(KF80) 착용을 권장합니다.')
  if (dustGrade === '4') tips.push('😷 미세먼지 매우 나쁨. KF94 마스크 필수입니다.')

  // Wind tips
  if (windSpeed >= 10 && (terrain === 'coastal' || terrain === 'river' || terrain === 'golf')) {
    tips.push('💨 강한 바람이 예상됩니다. 방풍 소재 아우터를 반드시 착용하세요.')
  }

  // Temperature gap tips
  if (zone === 'mild' || zone === 'cool') {
    tips.push('🌡 아침저녁으로 기온차가 있어요. 겉옷을 꼭 챙기세요.')
  }

  // Activity duration tips
  if (duration >= 4 && (zone === 'cold' || zone === 'freezing')) {
    tips.push('⏱ 장시간 야외 활동 시 보온에 특히 신경 쓰세요.')
  }

  // Activity-specific
  if (activity === 'hiking' && zone === 'warm') {
    tips.push('🏔 등산 시 올라가면 기온이 더 낮아집니다. 얇은 겉옷을 배낭에 챙기세요.')
  }
  if (activity === 'golf') {
    tips.push('⛳ 골프 라운딩 시 체온 변화를 고려해 레이어링을 준비하세요.')
  }

  return tips.slice(0, 4) // 최대 4개
}

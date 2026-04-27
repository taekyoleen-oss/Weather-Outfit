export type ActivityType =
  | 'urban_walk'    // 도심 산책·쇼핑
  | 'running'       // 달리기·조깅
  | 'cycling'       // 자전거
  | 'golf'          // 골프
  | 'hiking'        // 등산·트레킹
  | 'picnic'        // 소풍·캠핑
  | 'river'         // 한강·강변
  | 'beach'         // 해변·해수욕
  | 'ski'           // 스키·스노보드
  | 'tennis'        // 테니스·배드민턴

export type GenderType = 'male' | 'female'

export interface OutfitItem {
  id: string
  name: string
  icon: string           // emoji or path
  category: OutfitCategory
  required: boolean
  condition?: string     // 착용 조건 설명
  colorHint?: string     // 추천 색상 힌트
  activityTag?: string   // 활동 전용 아이템 표시 (예: '달리기 특화')
}

export type OutfitCategory =
  | 'base'       // 이너·속옷
  | 'top'        // 상의 (티셔츠·셔츠·긴팔)
  | 'mid'        // 미들레이어 (맨투맨·후드·니트)
  | 'outer'      // 아우터 (점퍼·코트·패딩)
  | 'bottom'     // 하의
  | 'foot'       // 신발·양말
  | 'acc'        // 액세서리 (모자·장갑·목도리·선글라스·선크림)
  | 'rain'       // 우산·우비
  | 'mask'       // 마스크

export interface OutfitResult {
  items: OutfitItem[]
  heroIllust: HeroIllustKey
  layerLevel: number          // 1=얇게 / 2=기본 / 3=두껍게
  layerLabel: string
  tempZone: TempZone
  uvAlert: boolean
  dustAlert: boolean
  rainAlert: boolean
  windAlert: boolean
  tips: string[]              // 추가 착장 팁
  microclimateNote?: string   // 장소별 미기후 설명
}

export type TempZone =
  | 'hot'         // 28°C 이상
  | 'warm'        // 23~27°C
  | 'mild'        // 17~22°C
  | 'cool'        // 12~16°C
  | 'cold'        // 5~11°C
  | 'freezing'    // 4°C 이하

export type HeroIllustKey =
  | 'summer-light'
  | 'summer-sport'
  | 'spring-mild'
  | 'fall-layered'
  | 'winter-heavy'
  | 'rain-gear'
  | 'snow-gear'
  | 'beach-look'
  | 'ski-look'
  | 'golf-look'

export interface OutfitInput {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  uvIndex: number
  ptyCode: string    // '0'=없음 '1'=비 '2'=비눈 '3'=눈 '4'=소나기
  dustGrade: string  // '1'=좋음 '2'=보통 '3'=나쁨 '4'=매우나쁨
  activity: ActivityType
  gender: GenderType
  hour: number       // 시작 시간 (24h)
  duration: number   // 지속 시간 (시간)
  terrain: string
}

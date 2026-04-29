import type { PtyCode, SkyCode } from '@/types/weather'

/** 복장 일러스트 상단 날씨 라인 데코용 */
export interface OutfitWeatherSnapshot {
  skyCode: SkyCode
  ptyCode: PtyCode
}

export type ActivityType =
  | 'urban_walk'    // 산책·쇼핑 등 일상 외출
  | 'running'       // 달리기·조깅
  | 'cycling'       // 자전거
  | 'golf'          // 골프
  | 'hiking'        // 등산·트레킹
  | 'picnic'        // 소풍·캠핑
  | 'river'         // 강변
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

export type DangerLevel = 'none' | 'caution' | 'warning' | 'cancel'

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
  dangerLevel: DangerLevel    // 최우선 위험 등급
  dangerReasons: string[]     // 위험 사유 목록
  cancelActivity: boolean     // 활동 취소 권고 여부
  ozoneTimeWarning: string | null  // 오전 10시~오후 4시 오존 피크 시간대 경고
}

/** 체감 구간 — weather-outdoor-clothing-guide.md 라.2 기준 */
export type TempZone =
  | 'hot'         // 28°C 이상
  | 'warm'        // 23~27°C
  | 'mild'        // 18~22°C
  | 'cool'        // 12~17°C
  | 'cold'        // 6~11°C
  | 'freezing'    // 0~5℃ 및 0℃ 미만(세부는 feelsLike로 구분)

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
  o3Grade?: string   // '1'=좋음 '2'=보통 '3'=나쁨 '4'=매우나쁨
  precipitation: number  // mm (1시간 강수량)
  activity: ActivityType
  gender: GenderType
  hour: number       // 시작 시간 (24h)
  duration: number   // 지속 시간 (시간)
  terrain: string
}

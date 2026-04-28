export type SkyCode = '1' | '3' | '4'
export type PtyCode = '0' | '1' | '2' | '3' | '4'

export interface CurrentWeather {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  skyCode: SkyCode
  ptyCode: PtyCode
  precipitation: number
  uvIndex: number
  visibility: number
  location: string
  nx: number
  ny: number
  fetchedAt: number
  /** 이 슬롯이 기준으로 하는 KST 날짜 yyyymmdd (복장 히어로 문구 등) */
  basisDateKst?: string
}

export interface HourlyForecast {
  /** 예보 기준일 KST yyyymmdd (시간별 스트립에서 내일/모레 구분) */
  fcstDate?: string
  time: string
  temperature: number
  skyCode: SkyCode
  ptyCode: PtyCode
  precipitation: number
  humidity: number
  windSpeed: number
  pop: number
}

/** 직전에 끝난 시간대(예: 새벽) 대표 슬롯의 날씨 — WeatherCard·Highlights 표시용 */
export interface PreviousPeriodWeatherSummary {
  periodLabel: string
  weatherLabel: string
  emoji: string
  temperature: number
  feelsLike: number
}

/** 오전 시간대(6–11시) 날씨 요약 — 오후·저녁에 WeatherCard에 표시 */
export interface MorningSummary {
  minTemp: number
  maxTemp: number
  weatherLabel: string
  emoji: string
  totalPrecip: number
}

export interface DailyForecast {
  date: string
  minTemp: number
  maxTemp: number
  skyCode: SkyCode
  ptyCode: PtyCode
  pop: number
  hourly?: HourlyForecast[]
}

export interface DustData {
  pm10Value: number
  pm25Value: number
  pm10Grade: string
  pm25Grade: string
  o3Value?: number    // 오존 농도 (ppm) — 에어코리아 API
  o3Grade?: string   // 오존 등급 '1'=좋음 '2'=보통 '3'=나쁨 '4'=매우나쁨
  stationName: string
  fetchedAt: number
}

export type DustGrade = 'good' | 'normal' | 'bad' | 'very_bad'

export interface SunriseSunset {
  sunrise: string
  sunset: string
  date: string
}

export interface WeatherAlert {
  type: string
  level: string
  region: string
  message: string
  startTime: string
  endTime: string
}

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

export type IllustKey =
  | 'clear'
  | 'partly'
  | 'mostly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'rain-snow'
  | 'snow'
  | 'fog'
  | 'storm'
  | 'shower'

export interface WeatherSnapshot {
  current: CurrentWeather
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  dust?: DustData
  sunriseSunset?: SunriseSunset
  alerts?: WeatherAlert[]
}

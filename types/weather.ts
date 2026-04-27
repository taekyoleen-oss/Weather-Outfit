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
}

export interface HourlyForecast {
  time: string
  temperature: number
  skyCode: SkyCode
  ptyCode: PtyCode
  precipitation: number
  humidity: number
  windSpeed: number
  pop: number
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

import Image from 'next/image'
import type { SkyCode, PtyCode, TimeOfDay } from '@/types/weather'
import { pickIllustKey, illustFile, weatherLabel } from '@/lib/utils/formatWeather'
import { NightCloudyIcon } from './NightCloudyIcon'

interface Props {
  skyCode: SkyCode
  ptyCode: PtyCode
  period: TimeOfDay
  iconSrc?: string
  iconHour?: number
  sunsetHm?: number | null
  size?: number
}

const WEATHER_EMOJI: Record<string, string> = {
  '맑음': '☀️',
  '구름 많음': '🌤',
  '흐림': '☁️',
  '비': '🌧',
  '비/눈': '🌨',
  '눈': '❄️',
  '소나기': '⛈',
}

export function WeatherHeroIllustration({ skyCode, ptyCode, period, iconSrc, iconHour, sunsetHm, size = 160 }: Props) {
  const key = pickIllustKey(skyCode, ptyCode)
  const file = illustFile(key, period)
  const src = iconSrc ?? `/illust/weather/${file}.svg`
  const label = weatherLabel(skyCode, ptyCode)
  const isNight =
    typeof iconHour === 'number'
      ? (sunsetHm == null ? (iconHour >= 19 || iconHour < 6) : (iconHour * 100 > sunsetHm || iconHour < 6))
      : period === 'night'
  const isNightCloudy = isNight && label === '구름 많음'
  const emoji =
    isNight && label === '맑음'
      ? '🌙'
      : isNightCloudy
      ? '🌙'
      : (WEATHER_EMOJI[label] ?? '🌤')

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {iconHour !== undefined ? (
        isNightCloudy ? (
          <NightCloudyIcon size={size} />
        ) : (
          <span
            className="leading-none"
            style={{
              fontSize: Math.round(size * 0.45),
              color: isNight ? '#94A3B8' : 'initial',
              filter: isNight ? 'grayscale(1) saturate(0)' : 'none',
              fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
            }}
          >
            {emoji}
          </span>
        )
      ) : (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          priority
        />
      )}
    </div>
  )
}

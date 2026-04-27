import Image from 'next/image'
import type { SkyCode, PtyCode, TimeOfDay } from '@/types/weather'
import { pickIllustKey, illustFile } from '@/lib/utils/formatWeather'

interface Props {
  skyCode: SkyCode
  ptyCode: PtyCode
  period: TimeOfDay
  size?: number
}

export function WeatherHeroIllustration({ skyCode, ptyCode, period, size = 160 }: Props) {
  const key = pickIllustKey(skyCode, ptyCode)
  const file = illustFile(key, period)

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src={`/illust/weather/${file}.svg`}
        alt=""
        width={size}
        height={size}
        priority
      />
    </div>
  )
}

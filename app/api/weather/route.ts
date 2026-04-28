import { NextRequest, NextResponse } from 'next/server'
import { fetchVilageForecast } from '@/lib/weather/kma'
import { kvSWR, TTL } from '@/lib/cache/kv'
import { reverseGeocode } from '@/lib/location/kakao'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const nx = parseInt(searchParams.get('nx') ?? '60', 10)
  const ny = parseInt(searchParams.get('ny') ?? '127', 10)
  const lat = parseFloat(searchParams.get('lat') ?? '37.5665')
  const lon = parseFloat(searchParams.get('lon') ?? '126.9780')

  try {
    // 캐시 키에 KMA 발표 시각(baseTime)을 포함해, 발표 시각이 바뀌면 즉시 새 데이터를 가져온다.
    // kma.ts 의 getBaseDateTime 과 동일한 규칙: base < h (base+1시부터 데이터 시작)
    const kstHour = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCHours()
    const KMA_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23]
    const validBases = KMA_BASE_HOURS.filter((b) => b < kstHour)
    const baseTime = validBases.length ? validBases[validBases.length - 1] : 23
    const key = `vfcst2:${nx}:${ny}:${baseTime}`
    const data = await kvSWR(key, TTL.shortForecast, () => fetchVilageForecast(nx, ny))

    // resolve location name
    let locationName = searchParams.get('name') ?? ''
    if (!locationName) {
      try {
        locationName = await reverseGeocode(lat, lon)
      } catch {
        locationName = `${nx}, ${ny}`
      }
    }
    data.current.location = locationName

    return NextResponse.json({ ...data, fetchedAt: data.current.fetchedAt })
  } catch (err) {
    console.error('Weather API error:', err)
    return NextResponse.json({ error: '날씨 데이터를 불러오지 못했습니다.' }, { status: 500 })
  }
}

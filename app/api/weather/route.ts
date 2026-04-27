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
    const key = `vfcst:${nx}:${ny}:${Math.floor(Date.now() / (TTL.shortForecast * 1000))}`
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

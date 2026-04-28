import { NextRequest, NextResponse } from 'next/server'
import { fetchOpenMeteoDailyCompare } from '@/lib/weather/openMeteoCompare'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '37.5665')
  const lon = parseFloat(searchParams.get('lon') ?? '126.9780')

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: '좌표가 올바르지 않습니다.' }, { status: 400 })
  }

  try {
    const data = await fetchOpenMeteoDailyCompare(lat, lon)
    return NextResponse.json(data)
  } catch (e) {
    console.error('[weather/compare]', e)
    return NextResponse.json(
      { yesterdaySameHourTemp: null, todayMin: null, todayMax: null },
      { status: 200 }
    )
  }
}

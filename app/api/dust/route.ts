import { NextRequest, NextResponse } from 'next/server'
import { fetchDust, getNearestStation } from '@/lib/weather/dust'
import { kvSWR, TTL } from '@/lib/cache/kv'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const nx = parseInt(searchParams.get('nx') ?? '60', 10)
  const ny = parseInt(searchParams.get('ny') ?? '127', 10)
  const station = searchParams.get('station') ?? getNearestStation(nx, ny)

  try {
    const key = `dust:${station}`
    const data = await kvSWR(key, TTL.dust, () => fetchDust(station))
    return NextResponse.json(data)
  } catch (err) {
    console.error('Dust API error:', err)
    return NextResponse.json({ error: '미세먼지 데이터를 불러오지 못했습니다.' }, { status: 500 })
  }
}

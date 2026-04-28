import { NextRequest, NextResponse } from 'next/server'
import { fetchWeeklyForecast, getMidRegionCode } from '@/lib/weather/kma-weekly'
import { kvSWR, TTL } from '@/lib/cache/kv'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const nx = parseInt(searchParams.get('nx') ?? '60', 10)
  const ny = parseInt(searchParams.get('ny') ?? '127', 10)

  try {
    const regId = getMidRegionCode(nx, ny)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    // v3: getMidTa region-code fix 반영 후 기존 잘못된 캐시(10/20 fallback) 우회
    const key = `midfcst3:${regId}:${today}`
    const data = await kvSWR(key, TTL.midForecast, () => fetchWeeklyForecast(nx, ny))
    console.log('[weekly] result sample:', JSON.stringify(data?.[0]))
    return NextResponse.json(data)
  } catch (err) {
    console.error('Weekly forecast error:', err)
    return NextResponse.json({ error: '주간 예보를 불러오지 못했습니다.' }, { status: 500 })
  }
}

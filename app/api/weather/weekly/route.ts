import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchWeeklyForecast, getMidRegionCode } from '@/lib/weather/kma-weekly'
import { kvSWR, TTL } from '@/lib/cache/kv'
import { kstTodayYmd } from '@/lib/utils/timeOfDay'

const QuerySchema = z.object({
  nx: z.coerce.number().int().min(1).max(149),
  ny: z.coerce.number().int().min(1).max(253),
})

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = QuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: '유효하지 않은 파라미터입니다.' }, { status: 400 })
  }
  const { nx, ny } = parsed.data

  try {
    const regId = getMidRegionCode(nx, ny)
    const today = kstTodayYmd()
    const key = `midfcst3:${regId}:${today}`
    const data = await kvSWR(key, TTL.midForecast, () => fetchWeeklyForecast(nx, ny))
    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
    return res
  } catch (err) {
    console.error('Weekly forecast error:', err)
    return NextResponse.json({ error: '주간 예보를 불러오지 못했습니다.' }, { status: 500 })
  }
}

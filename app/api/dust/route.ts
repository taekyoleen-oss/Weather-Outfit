import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchDust, getNearestStation } from '@/lib/weather/dust'
import { kvSWR, TTL } from '@/lib/cache/kv'

const QuerySchema = z.object({
  nx: z.coerce.number().int().min(1).max(149),
  ny: z.coerce.number().int().min(1).max(253),
  // 측정소명: 한글·공백·영문 조합, 최대 30자
  station: z.string().max(30).regex(/^[가-힣a-zA-Z0-9\s]+$/).optional(),
})

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = QuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: '유효하지 않은 파라미터입니다.' }, { status: 400 })
  }
  const { nx, ny, station: stationParam } = parsed.data
  const station = stationParam ?? getNearestStation(nx, ny)

  try {
    const key = `dust:${station}`
    const data = await kvSWR(key, TTL.dust, () => fetchDust(station))
    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
    return res
  } catch (err) {
    console.error('Dust API error:', err)
    return NextResponse.json({ error: '미세먼지 데이터를 불러오지 못했습니다.' }, { status: 500 })
  }
}

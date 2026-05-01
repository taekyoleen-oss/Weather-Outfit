import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchSunriseSunset } from '@/lib/weather/kma-sunrise'
import { kvSWR, TTL } from '@/lib/cache/kv'
import { kstTodayYmd } from '@/lib/utils/timeOfDay'

const QuerySchema = z.object({
  lat: z.coerce.number().min(33).max(43),
  lon: z.coerce.number().min(124).max(132),
})

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = QuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: '유효하지 않은 좌표입니다.' }, { status: 400 })
  }
  const { lat, lon } = parsed.data

  try {
    const today = kstTodayYmd()
    const key = `riseset:${lat.toFixed(3)}:${lon.toFixed(3)}:${today}`
    const data = await kvSWR(key, TTL.riseset, () => fetchSunriseSunset(lat, lon))
    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
    return res
  } catch (err) {
    console.error('Sunrise API error:', err)
    return NextResponse.json({ sunrise: '0606', sunset: '1850', date: '' })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchWeatherAlerts } from '@/lib/weather/kma-alert'
import { kvSWR, TTL } from '@/lib/cache/kv'

const QuerySchema = z.object({
  regCode: z.string().regex(/^\d{1,12}$/).default('108'),
})

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = QuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: '유효하지 않은 regCode입니다.' }, { status: 400 })
  }
  const { regCode } = parsed.data

  try {
    const key = `alert:${regCode}`
    const data = await kvSWR(key, TTL.alert, () => fetchWeatherAlerts(regCode))
    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
    return res
  } catch (err) {
    console.error('Alert API error:', err)
    return NextResponse.json([])
  }
}

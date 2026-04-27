import { NextRequest, NextResponse } from 'next/server'
import { fetchWeatherAlerts } from '@/lib/weather/kma-alert'
import { kvSWR, TTL } from '@/lib/cache/kv'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const regCode = searchParams.get('regCode') ?? '108'

  try {
    const key = `alert:${regCode}`
    const data = await kvSWR(key, TTL.alert, () => fetchWeatherAlerts(regCode))
    return NextResponse.json(data)
  } catch (err) {
    console.error('Alert API error:', err)
    return NextResponse.json([])
  }
}

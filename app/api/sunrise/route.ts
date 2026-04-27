import { NextRequest, NextResponse } from 'next/server'
import { fetchSunriseSunset } from '@/lib/weather/kma-sunrise'
import { kvSWR, TTL } from '@/lib/cache/kv'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '37.5665')
  const lon = parseFloat(searchParams.get('lon') ?? '126.9780')

  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const key = `riseset:${lat.toFixed(3)}:${lon.toFixed(3)}:${today}`
    const data = await kvSWR(key, TTL.riseset, () => fetchSunriseSunset(lat, lon))
    return NextResponse.json(data)
  } catch (err) {
    console.error('Sunrise API error:', err)
    return NextResponse.json({ sunrise: '0606', sunset: '1850', date: '' })
  }
}

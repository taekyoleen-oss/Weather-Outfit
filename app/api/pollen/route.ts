import { NextRequest, NextResponse } from 'next/server'
import { kvSWR, TTL } from '@/lib/cache/kv'
import { fetchPollen } from '@/lib/weather/pollen'
import { resolveAreaNoByCoords } from '@/lib/location/areaCode'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = Number(searchParams.get('lat') ?? '37.5665')
  const lon = Number(searchParams.get('lon') ?? '126.9780')
  const nx = Number(searchParams.get('nx') ?? '60')
  const ny = Number(searchParams.get('ny') ?? '127')
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(nx) || !Number.isFinite(ny)) {
    return NextResponse.json({ error: '좌표 파라미터가 올바르지 않습니다.' }, { status: 400 })
  }

  try {
    const areaNo = await resolveAreaNoByCoords({ lat, lon, nx, ny })
    const key = `pollen:${areaNo}`
    const data = await kvSWR(key, TTL.dust, () => fetchPollen({ areaNo }))
    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
    return res
  } catch (err) {
    console.error('Pollen API error:', err)
    return NextResponse.json({ error: '꽃가루 데이터를 불러오지 못했습니다.' }, { status: 500 })
  }
}


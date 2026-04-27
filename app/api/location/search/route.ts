import { NextRequest, NextResponse } from 'next/server'
import { searchKakaoKeyword } from '@/lib/location/kakao'
import { latLonToGrid } from '@/lib/location/geoConvert'
import { detectTerrain } from '@/lib/location/terrainDetector'

export async function GET(req: NextRequest) {
  // Kakao key is optional — deferred to v1.1
  if (!process.env.KAKAO_LOCAL_API_KEY || process.env.KAKAO_LOCAL_API_KEY === 'YOUR_KAKAO_REST_API_KEY_HERE') {
    return NextResponse.json({ unavailable: true, message: '장소 검색은 다음 버전에서 제공됩니다. GPS 버튼으로 현재 위치를 사용하세요.' })
  }

  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''

  if (!query.trim()) return NextResponse.json([])

  try {
    const results = await searchKakaoKeyword(query)
    const locations = results.map((r) => {
      const lat = parseFloat(r.y)
      const lon = parseFloat(r.x)
      const grid = latLonToGrid({ lat, lon })
      return {
        name: r.place_name,
        address: r.road_address_name || r.address_name,
        lat,
        lon,
        nx: grid.nx,
        ny: grid.ny,
        terrain: detectTerrain(r.place_name, r.address_name, r.category_group_code),
      }
    })
    return NextResponse.json(locations)
  } catch (err) {
    console.error('Location search error:', err)
    return NextResponse.json({ error: '장소 검색에 실패했습니다.' }, { status: 500 })
  }
}

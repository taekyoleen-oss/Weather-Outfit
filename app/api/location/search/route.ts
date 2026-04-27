import { NextRequest, NextResponse } from 'next/server'
import { searchKakaoKeyword, searchKakaoAddress } from '@/lib/location/kakao'
import { searchNominatim } from '@/lib/location/geocoding'
import { searchGolfCourses } from '@/lib/location/golfCourses'
import { latLonToGrid } from '@/lib/location/geoConvert'
import { detectTerrain } from '@/lib/location/terrainDetector'
import type { LocationInfo, KakaoSearchResult } from '@/types/location'

function kakaoToLocation(r: KakaoSearchResult): LocationInfo {
  const lat = parseFloat(r.y)
  const lon = parseFloat(r.x)
  const grid = latLonToGrid({ lat, lon })
  return {
    name: r.place_name,
    address: r.road_address_name || r.address_name,
    lat, lon,
    nx: grid.nx, ny: grid.ny,
    terrain: detectTerrain(r.place_name, r.address_name, r.category_group_code),
  }
}

function dedup(locs: LocationInfo[]): LocationInfo[] {
  const seen = new Set<string>()
  return locs.filter((l) => {
    const key = `${Math.round(l.lat * 100)},${Math.round(l.lon * 100)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''

  if (!query.trim()) return NextResponse.json([])

  // ── 0. 골프장 내장 DB (항상 최우선) ─────────────────────────────
  const golfHits = searchGolfCourses(query, 4)

  const hasKakao =
    !!process.env.KAKAO_LOCAL_API_KEY &&
    process.env.KAKAO_LOCAL_API_KEY !== 'YOUR_KAKAO_REST_API_KEY_HERE'

  const collected: LocationInfo[] = []

  // ── 1. Kakao keyword + address (병렬 시도) ──────────────────
  if (hasKakao) {
    const [kwRes, addrRes] = await Promise.allSettled([
      searchKakaoKeyword(query),
      searchKakaoAddress(query),
    ])

    if (kwRes.status === 'fulfilled') {
      collected.push(...kwRes.value.map(kakaoToLocation))
    } else {
      console.warn('[search] Kakao keyword failed:', kwRes.reason)
    }

    if (addrRes.status === 'fulfilled') {
      collected.push(...addrRes.value.map(kakaoToLocation))
    } else {
      console.warn('[search] Kakao address failed:', addrRes.reason)
    }
  }

  // 골프장 히트 + 일반 결과 합치기 (골프장 먼저, 중복 제거)
  const merged = dedup([...golfHits, ...collected])
  if (merged.length > 0) {
    return NextResponse.json(merged.slice(0, 6))
  }

  // ── 2. Nominatim fallback ────────────────────────────────────
  try {
    const results = await searchNominatim(query)
    return NextResponse.json(results)
  } catch (err) {
    console.error('[search] Nominatim failed:', err)
    return NextResponse.json(
      { error: '검색에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}

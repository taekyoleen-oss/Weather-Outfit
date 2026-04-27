import { NextRequest, NextResponse } from 'next/server'
import { latLonToGrid } from '@/lib/location/geoConvert'
import { reverseGeocodeComponents } from '@/lib/location/kakao'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '37.5665')
  const lon = parseFloat(searchParams.get('lon') ?? '126.9780')

  try {
    const grid = latLonToGrid({ lat, lon })
    const { label, addressLine } = await reverseGeocodeComponents(lat, lon)
    return NextResponse.json({ lat, lon, ...grid, name: label, address: addressLine })
  } catch (err) {
    console.error('Resolve error:', err)
    return NextResponse.json({ error: '위치 변환에 실패했습니다.' }, { status: 500 })
  }
}

import type { DustData } from '@/types/weather'
import { safeFetch } from '@/lib/utils/safeFetch'

const BASE = 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc'

let _airKey: string | null = null
function airKey(): string {
  if (_airKey !== null) return _airKey
  const raw = process.env.AIRKOREA_API_KEY
  if (!raw) throw new Error('AIRKOREA_API_KEY not set')
  try { _airKey = decodeURIComponent(raw) } catch { _airKey = raw }
  return _airKey
}

export async function fetchDust(stationName: string): Promise<DustData> {
  const params = new URLSearchParams({
    serviceKey: airKey(),
    returnType: 'json',
    numOfRows: '1',
    pageNo: '1',
    stationName,
    dataTerm: 'DAILY',
    ver: '1.0',
  })

  const url = `${BASE}/getMsrstnAcctoRltmMesureDnsty?${params}`
  const res = await safeFetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Air Korea API error: ${res.status}`)

  const json = await res.json()
  const item = json?.response?.body?.items?.[0]
  if (!item) throw new Error('No dust data')

  const pm10Value = parseFloat(item.pm10Value)
  const pm25Value = parseFloat(item.pm25Value)
  if (isNaN(pm10Value) || isNaN(pm25Value)) throw new Error('Dust values not available (sensor under maintenance)')

  const o3Raw = parseFloat(item.o3Value)
  const o3Value = isNaN(o3Raw) ? undefined : o3Raw
  const o3Grade = item.o3Grade ?? undefined

  return {
    pm10Value,
    pm25Value,
    pm10Grade: item.pm10Grade ?? '2',
    pm25Grade: item.pm25Grade ?? '2',
    o3Value,
    o3Grade,
    stationName,
    fetchedAt: Date.now(),
  }
}

// Nearest AirKorea measurement station by KMA grid (nx, ny).
// 시·도 단위 fallback으로 "중구(서울)" 고착 문제 해소.
export function getNearestStation(nx: number, ny: number): string {
  // ── 제주 ──
  if (nx >= 50 && nx <= 62 && ny >= 50 && ny <= 68) return '제주'
  // ── 부산/경남 ──
  if (nx >= 93 && nx <= 103 && ny >= 74 && ny <= 88) return '부산 중구'
  if (nx >= 83 && nx <= 95 && ny >= 74 && ny <= 88) return '창원'
  if (nx >= 95 && nx <= 107 && ny >= 84 && ny <= 98) return '울산 중구'
  // ── 대구/경북 ──
  if (nx >= 89 && nx <= 99 && ny >= 90 && ny <= 104) return '대구 중구'
  if (nx >= 99 && nx <= 110 && ny >= 100 && ny <= 118) return '안동'
  if (nx >= 88 && nx <= 100 && ny >= 104 && ny <= 118) return '구미'
  // ── 강원 ──
  if (nx >= 104 && nx <= 118 && ny >= 128 && ny <= 145) return '강릉'
  if (nx >= 80 && nx <= 98 && ny >= 128 && ny <= 145) return '춘천'
  if (nx >= 92 && nx <= 105 && ny >= 118 && ny <= 135) return '원주'
  // ── 전남/광주 ──
  if (nx >= 57 && nx <= 68 && ny >= 78 && ny <= 92) return '광주 북구'
  if (nx >= 48 && nx <= 60 && ny >= 70 && ny <= 84) return '목포'
  if (nx >= 72 && nx <= 84 && ny >= 72 && ny <= 86) return '순천'
  // ── 전북 ──
  if (nx >= 59 && nx <= 72 && ny >= 93 && ny <= 108) return '전주'
  if (nx >= 50 && nx <= 62 && ny >= 93 && ny <= 108) return '군산'
  // ── 충남 ──
  if (nx >= 57 && nx <= 68 && ny >= 108 && ny <= 122) return '대전 유성구'
  if (nx >= 48 && nx <= 60 && ny >= 106 && ny <= 122) return '천안'
  // ── 충북 ──
  if (nx >= 68 && nx <= 80 && ny >= 110 && ny <= 124) return '청주'
  // ── 서울 세분 ──
  if (nx >= 58 && nx <= 65 && ny >= 125 && ny <= 133) return '중구'
  if (nx >= 63 && nx <= 72 && ny >= 124 && ny <= 132) return '강남구'
  if (nx >= 54 && nx <= 62 && ny >= 124 && ny <= 133) return '마포구'
  if (nx >= 62 && nx <= 70 && ny >= 131 && ny <= 138) return '노원구'
  // ── 인천/경기 ──
  if (nx >= 48 && nx <= 58 && ny >= 124 && ny <= 137) return '인천 중구'
  if (nx >= 52 && nx <= 64 && ny >= 112 && ny <= 126) return '수원'
  if (nx >= 65 && nx <= 76 && ny >= 118 && ny <= 128) return '성남'
  // ── 기본: 서울 중구 ──
  return '중구'
}

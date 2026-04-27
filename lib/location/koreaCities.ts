import type { LocationInfo } from '@/types/location'
import { latLonToGrid } from './geoConvert'

/** 한국 주요 행정구역 — 날씨 지역 선택용 내장 데이터 */
const RAW: { name: string; lat: number; lon: number }[] = [
  // 서울
  { name: '서울 종로·중구', lat: 37.5683, lon: 126.9778 },
  { name: '서울 강남·서초', lat: 37.4979, lon: 127.0276 },
  { name: '서울 강동·송파', lat: 37.5145, lon: 127.1054 },
  { name: '서울 마포·용산', lat: 37.5439, lon: 126.9506 },
  { name: '서울 강서·양천', lat: 37.5509, lon: 126.8495 },
  { name: '서울 도봉·노원', lat: 37.6545, lon: 127.0570 },
  { name: '서울 성동·광진', lat: 37.5636, lon: 127.0366 },
  // 경기
  { name: '수원', lat: 37.2636, lon: 127.0286 },
  { name: '성남·분당', lat: 37.4386, lon: 127.1377 },
  { name: '고양·일산', lat: 37.6563, lon: 126.8350 },
  { name: '용인', lat: 37.2411, lon: 127.1775 },
  { name: '인천', lat: 37.4563, lon: 126.7052 },
  { name: '부천', lat: 37.5034, lon: 126.7660 },
  { name: '화성', lat: 37.1996, lon: 126.8312 },
  { name: '안양', lat: 37.3943, lon: 126.9568 },
  { name: '광주(경기)', lat: 37.4296, lon: 127.2557 },
  { name: '평택', lat: 36.9921, lon: 127.1127 },
  // 강원
  { name: '춘천', lat: 37.8813, lon: 127.7298 },
  { name: '원주', lat: 37.3422, lon: 127.9202 },
  { name: '강릉', lat: 37.7519, lon: 128.8761 },
  { name: '속초', lat: 38.2070, lon: 128.5919 },
  // 충청
  { name: '대전', lat: 36.3504, lon: 127.3845 },
  { name: '세종', lat: 36.4800, lon: 127.2890 },
  { name: '천안', lat: 36.8151, lon: 127.1139 },
  { name: '청주', lat: 36.6424, lon: 127.4890 },
  // 전라
  { name: '광주(전남)', lat: 35.1595, lon: 126.8526 },
  { name: '전주', lat: 35.8242, lon: 127.1480 },
  { name: '여수', lat: 34.7604, lon: 127.6622 },
  { name: '목포', lat: 34.8118, lon: 126.3922 },
  // 경상
  { name: '부산', lat: 35.1796, lon: 129.0756 },
  { name: '대구', lat: 35.8714, lon: 128.6014 },
  { name: '울산', lat: 35.5384, lon: 129.3114 },
  { name: '경주', lat: 35.8562, lon: 129.2247 },
  { name: '포항', lat: 36.0190, lon: 129.3435 },
  { name: '창원', lat: 35.2279, lon: 128.6811 },
  { name: '진주', lat: 35.1799, lon: 128.1076 },
  // 제주
  { name: '제주시', lat: 33.4996, lon: 126.5312 },
  { name: '서귀포', lat: 33.2541, lon: 126.5600 },
]

export const KOREA_CITIES: LocationInfo[] = RAW.map(({ name, lat, lon }) => {
  const { nx, ny } = latLonToGrid({ lat, lon })
  return { name, lat, lon, nx, ny }
})

/** Haversine 거리 (km) */
function distKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 현재 위치로부터 가장 가까운 주요 도시 N개 반환 */
export function getNearbyKoreaCities(lat: number, lon: number, count = 5): LocationInfo[] {
  return KOREA_CITIES.map((c) => ({ city: c, dist: distKm(lat, lon, c.lat, c.lon) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count)
    .map(({ city }) => city)
}

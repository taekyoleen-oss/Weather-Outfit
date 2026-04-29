/**
 * 기상청 지상 관측소(ASOS) 일부 — 공공데이터포털 관측소 목록 기준 좌표(대표값).
 * 격자(nx,ny) 대신 사용자 위경도와의 거리·지점 식별용(웹 기온과의 심리적 정합성).
 * 전체 목록은 data.go.kr «기상청_지상_관측소_정보» CSV로 확장 가능.
 */
export interface KmaAsosStation {
  stn_id: string
  name: string
  lat: number
  lon: number
}

export const KMA_ASOS_STATIONS: KmaAsosStation[] = [
  { stn_id: '90', name: '속초', lat: 38.2509, lon: 128.5647 },
  { stn_id: '93', name: '북춘천', lat: 37.9474, lon: 127.7544 },
  { stn_id: '95', name: '철원', lat: 38.1479, lon: 127.3042 },
  { stn_id: '98', name: '동두천', lat: 37.9019, lon: 127.0607 },
  { stn_id: '99', name: '파주', lat: 37.8853, lon: 126.7665 },
  { stn_id: '100', name: '대관령', lat: 37.6771, lon: 128.7183 },
  { stn_id: '101', name: '춘천', lat: 37.9026, lon: 127.7357 },
  { stn_id: '102', name: '백령도', lat: 37.9739, lon: 124.7125 },
  { stn_id: '104', name: '북강릉', lat: 37.8046, lon: 128.8554 },
  { stn_id: '105', name: '강릉', lat: 37.7519, lon: 128.8908 },
  { stn_id: '106', name: '동해', lat: 37.5219, lon: 129.1243 },
  { stn_id: '108', name: '서울', lat: 37.5714, lon: 126.9658 },
  { stn_id: '112', name: '인천', lat: 37.4777, lon: 126.6249 },
  { stn_id: '114', name: '원주', lat: 37.3274, lon: 127.9411 },
  { stn_id: '115', name: '울릉도', lat: 37.4813, lon: 130.8986 },
  { stn_id: '119', name: '수원', lat: 37.2571, lon: 126.9829 },
  { stn_id: '121', name: '영월', lat: 37.1813, lon: 128.4574 },
  { stn_id: '127', name: '충주', lat: 36.9704, lon: 127.9527 },
  { stn_id: '129', name: '서산', lat: 36.7766, lon: 126.4939 },
  { stn_id: '130', name: '울진', lat: 36.9918, lon: 129.4128 },
  { stn_id: '131', name: '청주', lat: 36.6392, lon: 127.4407 },
  { stn_id: '133', name: '대전', lat: 36.3720, lon: 127.3721 },
  { stn_id: '135', name: '추풍령', lat: 36.2203, lon: 127.9946 },
  { stn_id: '136', name: '안동', lat: 36.5729, lon: 128.7073 },
  { stn_id: '137', name: '상주', lat: 36.4084, lon: 128.1574 },
  { stn_id: '138', name: '포항', lat: 36.0320, lon: 129.3800 },
  { stn_id: '140', name: '군산', lat: 35.9642, lon: 126.5638 },
  { stn_id: '143', name: '대구', lat: 35.8718, lon: 128.6019 },
  { stn_id: '146', name: '전주', lat: 35.8409, lon: 127.1172 },
  { stn_id: '152', name: '울산', lat: 35.5824, lon: 129.3347 },
  { stn_id: '155', name: '창원', lat: 35.1702, lon: 128.5728 },
  { stn_id: '156', name: '광주', lat: 35.1595, lon: 126.8530 },
  { stn_id: '159', name: '부산', lat: 35.1047, lon: 129.0320 },
  { stn_id: '162', name: '통영', lat: 34.8454, lon: 128.4356 },
  { stn_id: '165', name: '목포', lat: 34.7589, lon: 126.3818 },
  { stn_id: '168', name: '여수', lat: 34.7393, lon: 127.7406 },
  { stn_id: '169', name: '흑산도', lat: 34.6872, lon: 125.4511 },
  { stn_id: '170', name: '완도', lat: 34.3959, lon: 126.7018 },
  { stn_id: '172', name: '고창', lat: 35.3482, lon: 126.5990 },
  { stn_id: '174', name: '순천', lat: 34.9505, lon: 127.4872 },
  { stn_id: '177', name: '홍성', lat: 36.5247, lon: 126.4747 },
  { stn_id: '181', name: '서청주', lat: 36.6404, lon: 127.3845 },
  { stn_id: '184', name: '제주', lat: 33.51411, lon: 126.52969 },
  { stn_id: '185', name: '고산', lat: 33.2938, lon: 126.1628 },
  { stn_id: '188', name: '성산', lat: 33.3867, lon: 126.8802 },
  { stn_id: '189', name: '서귀포', lat: 33.24616, lon: 126.5653 },
  { stn_id: '192', name: '진주', lat: 35.1638, lon: 128.0400 },
  { stn_id: '201', name: '강화', lat: 37.7073, lon: 126.4464 },
  { stn_id: '202', name: '양평', lat: 37.4886, lon: 127.4944 },
  { stn_id: '203', name: '이천', lat: 37.26399, lon: 127.48421 },
  { stn_id: '211', name: '인제', lat: 38.0599, lon: 128.1671 },
  { stn_id: '212', name: '홍천', lat: 37.6836, lon: 127.8804 },
  { stn_id: '216', name: '태백', lat: 37.1598, lon: 128.9850 },
  { stn_id: '217', name: '정선군', lat: 37.3773, lon: 128.6731 },
  { stn_id: '221', name: '제천', lat: 37.1596, lon: 128.1943 },
  { stn_id: '226', name: '보은', lat: 36.4876, lon: 127.7341 },
  { stn_id: '232', name: '천안', lat: 36.7622, lon: 127.2922 },
  { stn_id: '235', name: '보령', lat: 36.3272, lon: 126.5575 },
  { stn_id: '236', name: '부여', lat: 36.2723, lon: 126.9207 },
  { stn_id: '238', name: '금산', lat: 36.1059, lon: 127.4819 },
  { stn_id: '239', name: '세종', lat: 36.4852, lon: 127.2443 },
  { stn_id: '243', name: '부안', lat: 35.7280, lon: 126.7320 },
  { stn_id: '244', name: '임실', lat: 35.6120, lon: 127.2856 },
  { stn_id: '245', name: '정읍', lat: 35.5633, lon: 126.8414 },
  { stn_id: '247', name: '남원', lat: 35.4020, lon: 127.3925 },
  { stn_id: '248', name: '장수', lat: 35.6567, lon: 127.5203 },
  { stn_id: '251', name: '고창군', lat: 35.4266, lon: 126.6972 },
  { stn_id: '252', name: '영광군', lat: 35.2837, lon: 126.4770 },
  { stn_id: '253', name: '김해시', lat: 35.2298, lon: 128.8908 },
  { stn_id: '254', name: '순창군', lat: 35.3713, lon: 127.1286 },
  { stn_id: '255', name: '북창원', lat: 35.2265, lon: 128.6726 },
  { stn_id: '257', name: '양산시', lat: 35.3074, lon: 129.0203 },
  { stn_id: '258', name: '보성군', lat: 34.7689, lon: 127.0801 },
  { stn_id: '259', name: '강진군', lat: 34.6441, lon: 126.7841 },
  { stn_id: '260', name: '장흥', lat: 34.6889, lon: 126.9194 },
  { stn_id: '261', name: '해남', lat: 34.5537, lon: 126.5691 },
  { stn_id: '262', name: '고흥', lat: 34.6183, lon: 127.2757 },
  { stn_id: '263', name: '의령군', lat: 35.3222, lon: 128.2886 },
  { stn_id: '264', name: '함양군', lat: 35.5114, lon: 127.7458 },
  { stn_id: '266', name: '광양시', lat: 34.9433, lon: 127.6914 },
  { stn_id: '268', name: '진도군', lat: 34.4720, lon: 126.2582 },
  { stn_id: '271', name: '봉화', lat: 36.9434, lon: 128.9145 },
  { stn_id: '272', name: '영주', lat: 36.8057, lon: 128.6240 },
  { stn_id: '273', name: '문경', lat: 36.6273, lon: 128.1488 },
  { stn_id: '276', name: '청송군', lat: 36.4333, lon: 129.0400 },
  { stn_id: '277', name: '영덕', lat: 36.5330, lon: 129.4093 },
  { stn_id: '278', name: '의성', lat: 36.3561, lon: 128.6886 },
  { stn_id: '279', name: '구미', lat: 36.1306, lon: 128.3650 },
  { stn_id: '281', name: '영천', lat: 35.9874, lon: 128.9514 },
  { stn_id: '283', name: '경주시', lat: 35.8174, lon: 129.2013 },
  { stn_id: '284', name: '거창', lat: 35.6674, lon: 127.9092 },
  { stn_id: '285', name: '합천', lat: 35.5650, lon: 128.1659 },
  { stn_id: '288', name: '밀양', lat: 35.4915, lon: 128.7441 },
  { stn_id: '289', name: '산청', lat: 35.4130, lon: 127.8792 },
  { stn_id: '294', name: '거제', lat: 34.8882, lon: 128.6046 },
  { stn_id: '295', name: '남해', lat: 34.8166, lon: 127.9264 },
]

function havKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function matchNearestAsosStation(lat: number, lon: number): KmaAsosStation & { distance_km: number } {
  let best = KMA_ASOS_STATIONS[0]
  let bestD = havKm(lat, lon, best.lat, best.lon)
  for (let i = 1; i < KMA_ASOS_STATIONS.length; i++) {
    const s = KMA_ASOS_STATIONS[i]
    const d = havKm(lat, lon, s.lat, s.lon)
    if (d < bestD) {
      bestD = d
      best = s
    }
  }
  return { ...best, distance_km: Math.round(bestD * 10) / 10 }
}

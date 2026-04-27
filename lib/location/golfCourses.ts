import type { LocationInfo } from '@/types/location'
import { latLonToGrid } from './geoConvert'

interface GolfCourseRaw {
  name: string
  aliases?: string[]
  addr: string
  lat: number
  lon: number
}

/**
 * 전국 주요 골프장 내장 데이터 (~170개)
 * 좌표는 KMA 5km 격자 정밀도 (±2km 이내)
 */
const RAW: GolfCourseRaw[] = [

  // ══════════════════════════════════════════
  // 서울
  // ══════════════════════════════════════════
  { name: '한양CC',     aliases: ['한양컨트리클럽'],         addr: '서울 성동구',         lat: 37.537, lon: 127.062 },
  { name: '서울CC',     aliases: ['서울컨트리클럽'],         addr: '서울 서초구 내곡동',   lat: 37.456, lon: 127.045 },
  { name: '태릉CC',     aliases: ['태릉컨트리클럽'],         addr: '서울 노원구 공릉동',   lat: 37.624, lon: 127.082 },

  // ══════════════════════════════════════════
  // 인천
  // ══════════════════════════════════════════
  { name: '스카이72GC',       aliases: ['스카이72', '클럽72'],      addr: '인천 중구 영종도',    lat: 37.493, lon: 126.491 },
  { name: '잭니클라우스GC',    aliases: ['잭니클라우스'],             addr: '인천 중구 영종도',    lat: 37.492, lon: 126.494 },
  { name: '베어즈베스트청라GC', aliases: ['베어즈베스트', '청라GC'],  addr: '인천 서구 청라동',   lat: 37.541, lon: 126.647 },
  { name: '인천CC',            addr: '인천 계양구',                                            lat: 37.440, lon: 126.651 },

  // ══════════════════════════════════════════
  // 경기 — 파주·고양·양주
  // ══════════════════════════════════════════
  { name: '뉴코리아CC',    aliases: ['뉴코리아'],           addr: '경기 파주시',           lat: 37.780, lon: 126.770 },
  { name: '파주CC',        addr: '경기 파주시',                                              lat: 37.762, lon: 126.801 },
  { name: '풍덕CC',        aliases: ['풍덕골프클럽'],       addr: '경기 파주시 교하읍',    lat: 37.812, lon: 126.791 },
  { name: '신안CC(고양)',  aliases: ['신안CC'],              addr: '경기 고양시',           lat: 37.649, lon: 126.788 },
  { name: '고양CC',        addr: '경기 고양시 일산',                                         lat: 37.668, lon: 126.810 },
  { name: '마제스티CC',    aliases: ['마제스티'],            addr: '경기 양주시',           lat: 37.805, lon: 127.042 },
  { name: '포레스트힐GC',  aliases: ['포레스트힐'],          addr: '경기 양주시',           lat: 37.771, lon: 127.098 },

  // ══════════════════════════════════════════
  // 경기 — 남양주·포천·가평
  // ══════════════════════════════════════════
  { name: '동부CC',            addr: '경기 남양주시',                                         lat: 37.631, lon: 127.321 },
  { name: '리베라CC',          aliases: ['리베라'],           addr: '경기 남양주시 화도읍', lat: 37.649, lon: 127.355 },
  { name: '일동레이크GC',      aliases: ['일동레이크'],        addr: '경기 포천시 일동면',  lat: 37.908, lon: 127.272 },
  { name: '포천힐스GC',        aliases: ['포천힐스'],          addr: '경기 포천시',         lat: 37.865, lon: 127.151 },
  { name: '베어스타운GC',      aliases: ['베어스타운'],        addr: '경기 포천시',         lat: 37.878, lon: 127.220 },
  { name: '파미에스테이션GC',  aliases: ['파미에스테이션'],    addr: '경기 포천시',         lat: 37.920, lon: 127.168 },
  { name: '파인크리크CC',      aliases: ['파인크리크'],        addr: '경기 가평군',         lat: 37.782, lon: 127.421 },
  { name: '가평베네스트GC',    aliases: ['가평베네스트'],      addr: '경기 가평군',         lat: 37.819, lon: 127.561 },
  { name: '아이파크GC(가평)',  aliases: ['아이파크GC'],        addr: '경기 가평군',         lat: 37.851, lon: 127.432 },
  { name: '레인보우힐스GC',    aliases: ['레인보우힐스'],      addr: '경기 가평군',         lat: 37.838, lon: 127.501 },
  { name: '제이드GC',          aliases: ['제이드팰리스'],      addr: '경기 가평군',         lat: 37.843, lon: 127.472 },

  // ══════════════════════════════════════════
  // 경기 — 김포·시흥·안산·부천
  // ══════════════════════════════════════════
  { name: '베어크리크GC',   aliases: ['베어크리크'],    addr: '경기 김포시',   lat: 37.479, lon: 126.761 },
  { name: '아시아나CC',     aliases: ['아시아나GC'],    addr: '경기 시흥시',   lat: 37.380, lon: 126.840 },
  { name: '상록CC',         addr: '경기 안산시',                                lat: 37.316, lon: 126.871 },

  // ══════════════════════════════════════════
  // 경기 — 수원·안양·과천·화성·평택
  // ══════════════════════════════════════════
  { name: '남서울CC',       addr: '경기 과천시',         lat: 37.451, lon: 127.003 },
  { name: '안양베네스트GC', aliases: ['안양베네스트', '안양CC'], addr: '경기 안양시', lat: 37.388, lon: 126.950 },
  { name: '수원CC',         addr: '경기 수원시',         lat: 37.228, lon: 127.062 },
  { name: '화성CC',         addr: '경기 화성시',         lat: 37.192, lon: 126.864 },
  { name: '레이크우드CC',   aliases: ['레이크우드'],     addr: '경기 화성시',   lat: 37.162, lon: 126.871 },
  { name: '서원힐스CC',     aliases: ['서원힐스'],       addr: '경기 화성시',   lat: 37.149, lon: 127.001 },
  { name: '남촌CC',         addr: '경기 화성시 봉담읍',  lat: 37.155, lon: 126.933 },
  { name: '골든베이GC(화성)', aliases: ['골든베이GC'],   addr: '경기 화성시',   lat: 37.191, lon: 126.860 },
  { name: '평택CC',         addr: '경기 평택시',         lat: 36.992, lon: 127.113 },

  // ══════════════════════════════════════════
  // 경기 — 용인·기흥
  // ══════════════════════════════════════════
  { name: '레이크사이드CC', aliases: ['레이크사이드'],         addr: '경기 용인시 처인구', lat: 37.294, lon: 127.085 },
  { name: '기흥CC',         addr: '경기 용인시 기흥구',                                    lat: 37.279, lon: 127.121 },
  { name: '엑슬루CC',       aliases: ['엑슬루'],               addr: '경기 용인시',       lat: 37.256, lon: 127.155 },
  { name: '세라지오CC',     aliases: ['세라지오'],             addr: '경기 용인시',       lat: 37.312, lon: 127.053 },
  { name: '한원CC',         aliases: ['한원골프클럽'],         addr: '경기 용인시',       lat: 37.261, lon: 127.096 },
  { name: '클럽모우CC',     aliases: ['클럽모우'],             addr: '경기 용인시',       lat: 37.290, lon: 127.140 },

  // ══════════════════════════════════════════
  // 경기 — 광주·이천·여주·안성·양평
  // ══════════════════════════════════════════
  { name: '태광CC',         addr: '경기 광주시',             lat: 37.364, lon: 127.247 },
  { name: '곤지암CC',       aliases: ['곤지암'],             addr: '경기 광주시 곤지암읍', lat: 37.376, lon: 127.334 },
  { name: '수피아CC',       aliases: ['수피아'],             addr: '경기 광주시',          lat: 37.384, lon: 127.342 },
  { name: '강변GC(광주)',   aliases: ['강변GC'],             addr: '경기 광주시',          lat: 37.396, lon: 127.201 },
  { name: '한국CC',         aliases: ['한국컨트리클럽'],     addr: '경기 이천시',          lat: 37.282, lon: 127.422 },
  { name: '이천CC',         addr: '경기 이천시',                                           lat: 37.248, lon: 127.431 },
  { name: '세인트포스CC',   aliases: ['세인트CC', '세인트포스'], addr: '경기 이천시',      lat: 37.261, lon: 127.402 },
  { name: '88CC',           aliases: ['쌍팔CC'],             addr: '경기 여주시',          lat: 37.311, lon: 127.641 },
  { name: '여주CC',         addr: '경기 여주시',                                           lat: 37.340, lon: 127.621 },
  { name: '스카이밸리CC',   aliases: ['스카이벨리', '스카이밸리', '스카이벨리CC', 'Sky Valley'], addr: '경기 여주시 금사면', lat: 37.352, lon: 127.698 },
  { name: '이포CC',         aliases: ['이포골프클럽'],       addr: '경기 여주시 금사면',   lat: 37.368, lon: 127.732 },
  { name: '그린필드CC',     aliases: ['그린필드'],           addr: '경기 양평군',          lat: 37.503, lon: 127.524 },
  { name: '양평CC',         addr: '경기 양평군',                                           lat: 37.492, lon: 127.491 },
  { name: '골든밸리CC',     aliases: ['골든밸리'],           addr: '경기 안성시',          lat: 36.952, lon: 127.282 },
  { name: '안성CC',         addr: '경기 안성시',                                           lat: 37.007, lon: 127.268 },

  // ══════════════════════════════════════════
  // 강원
  // ══════════════════════════════════════════
  { name: '오크밸리CC',      aliases: ['오크밸리'],          addr: '강원 원주시 지정면',   lat: 37.487, lon: 127.932 },
  { name: '원주CC',          addr: '강원 원주시',                                          lat: 37.341, lon: 127.921 },
  { name: '라헨느CC',        aliases: ['라헨느'],            addr: '강원 강릉시',          lat: 37.761, lon: 128.898 },
  { name: '강릉CC',          addr: '강원 강릉시',                                          lat: 37.764, lon: 128.871 },
  { name: '속초CC',          addr: '강원 속초시',                                          lat: 38.207, lon: 128.593 },
  { name: '고성CC(강원)',    aliases: ['고성CC'],             addr: '강원 고성군',          lat: 38.367, lon: 128.468 },
  { name: '엘리시안강촌GC',  aliases: ['엘리시안강촌', '강촌GC'], addr: '강원 춘천시 남산면', lat: 37.780, lon: 127.652 },
  { name: '춘천CC',          addr: '강원 춘천시',                                          lat: 37.869, lon: 127.681 },
  { name: '휘닉스파크GC',    aliases: ['휘닉스파크', '휘닉스CC'], addr: '강원 평창군 봉평면', lat: 37.591, lon: 128.593 },
  { name: '용평리조트GC',    aliases: ['용평GC', '용평리조트'], addr: '강원 평창군 대관령면', lat: 37.605, lon: 128.693 },
  { name: '알펜시아GC',      aliases: ['알펜시아'],          addr: '강원 평창군 대관령면', lat: 37.671, lon: 128.681 },
  { name: '비발디파크GC',    aliases: ['비발디파크'],        addr: '강원 홍천군 서면',     lat: 37.549, lon: 128.439 },
  { name: '웰리힐리파크GC',  aliases: ['웰리힐리'],          addr: '강원 횡성군',          lat: 37.491, lon: 128.271 },
  { name: '하이원GC',        aliases: ['하이원리조트GC', '하이원'], addr: '강원 정선군 고한읍', lat: 37.204, lon: 128.882 },
  { name: '동해CC',          addr: '강원 동해시',                                          lat: 37.524, lon: 129.114 },
  { name: '삼척CC',          addr: '강원 삼척시',                                          lat: 37.441, lon: 129.166 },
  { name: '영월CC',          addr: '강원 영월군',                                          lat: 37.182, lon: 128.461 },
  { name: '정선CC',          addr: '강원 정선군',                                          lat: 37.382, lon: 128.661 },
  { name: '태백CC',          addr: '강원 태백시',                                          lat: 37.164, lon: 128.985 },
  { name: '인제CC',          addr: '강원 인제군',                                          lat: 38.062, lon: 128.172 },

  // ══════════════════════════════════════════
  // 대전·세종·충청남도
  // ══════════════════════════════════════════
  { name: '유성CC',    addr: '대전 유성구',          lat: 36.390, lon: 127.354 },
  { name: '대전CC',    addr: '대전 대덕구',          lat: 36.402, lon: 127.421 },
  { name: '세종CC',    addr: '세종시',               lat: 36.498, lon: 127.271 },
  { name: '천안CC',    addr: '충남 천안시',          lat: 36.808, lon: 127.156 },
  { name: '아산CC',    addr: '충남 아산시',          lat: 36.786, lon: 127.093 },
  { name: '서산CC',    addr: '충남 서산시',          lat: 36.779, lon: 126.454 },
  { name: '당진CC',    addr: '충남 당진시',          lat: 36.882, lon: 126.627 },
  { name: '보령CC',    aliases: ['오션힐스CC', '오션힐스'], addr: '충남 보령시', lat: 36.330, lon: 126.610 },
  { name: '홍성CC',    addr: '충남 홍성군',          lat: 36.601, lon: 126.671 },
  { name: '공주CC',    addr: '충남 공주시',          lat: 36.448, lon: 127.122 },
  { name: '부여CC',    addr: '충남 부여군',          lat: 36.280, lon: 126.909 },
  { name: '태안CC',    addr: '충남 태안군',          lat: 36.746, lon: 126.296 },

  // ══════════════════════════════════════════
  // 충청북도
  // ══════════════════════════════════════════
  { name: '청주CC',    addr: '충북 청주시',    lat: 36.648, lon: 127.489 },
  { name: '충주CC',    addr: '충북 충주시',    lat: 36.972, lon: 127.889 },
  { name: '제천CC',    addr: '충북 제천시',    lat: 37.132, lon: 128.193 },
  { name: '음성CC',    addr: '충북 음성군',    lat: 36.939, lon: 127.647 },
  { name: '진천CC',    addr: '충북 진천군',    lat: 36.853, lon: 127.431 },
  { name: '증평CC',    addr: '충북 증평군',    lat: 36.780, lon: 127.575 },

  // ══════════════════════════════════════════
  // 전라북도
  // ══════════════════════════════════════════
  { name: '군산CC',    addr: '전북 군산시',    lat: 35.971, lon: 126.743 },
  { name: '전주CC',    addr: '전북 전주시',    lat: 35.831, lon: 127.101 },
  { name: '완주CC',    addr: '전북 완주군',    lat: 35.903, lon: 127.163 },
  { name: '무주CC',    aliases: ['무주리조트GC'], addr: '전북 무주군', lat: 35.921, lon: 127.641 },
  { name: '고창CC',    addr: '전북 고창군',    lat: 35.436, lon: 126.701 },
  { name: '남원CC',    addr: '전북 남원시',    lat: 35.416, lon: 127.392 },
  { name: '익산CC',    addr: '전북 익산시',    lat: 35.948, lon: 126.957 },
  { name: '정읍CC',    addr: '전북 정읍시',    lat: 35.563, lon: 126.856 },

  // ══════════════════════════════════════════
  // 광주·전라남도
  // ══════════════════════════════════════════
  { name: '광주CC',    addr: '광주 북구',         lat: 35.179, lon: 126.811 },
  { name: '전남CC',    addr: '전남 순천시',       lat: 34.893, lon: 127.353 },
  { name: '순천CC',    addr: '전남 순천시',       lat: 34.949, lon: 127.489 },
  { name: '여수CC',    addr: '전남 여수시',       lat: 34.761, lon: 127.661 },
  { name: '목포CC',    addr: '전남 목포시',       lat: 34.810, lon: 126.381 },
  { name: '남악CC',    addr: '전남 무안군',       lat: 34.811, lon: 126.443 },
  { name: '나주CC',    addr: '전남 나주시',       lat: 35.010, lon: 126.710 },
  { name: '해남CC',    addr: '전남 해남군',       lat: 34.570, lon: 126.599 },
  { name: '보성CC',    addr: '전남 보성군',       lat: 34.773, lon: 127.083 },
  { name: '장흥CC',    addr: '전남 장흥군',       lat: 34.681, lon: 126.907 },
  { name: '고흥CC',    addr: '전남 고흥군',       lat: 34.610, lon: 127.281 },
  { name: '구례CC',    addr: '전남 구례군',       lat: 35.203, lon: 127.462 },
  { name: '광양CC',    addr: '전남 광양시',       lat: 34.940, lon: 127.696 },
  { name: '담양CC',    addr: '전남 담양군',       lat: 35.314, lon: 126.987 },

  // ══════════════════════════════════════════
  // 대구·경상북도
  // ══════════════════════════════════════════
  { name: '대구CC',         addr: '대구 수성구',         lat: 35.821, lon: 128.681 },
  { name: '인터불고대구CC', aliases: ['인터불고CC', '인터불고'], addr: '대구 동구', lat: 35.920, lon: 128.760 },
  { name: '경주CC',         addr: '경북 경주시',         lat: 35.858, lon: 129.248 },
  { name: '블루원경주GC',   aliases: ['블루원경주'],      addr: '경북 경주시',         lat: 35.842, lon: 129.178 },
  { name: '포항CC',         addr: '경북 포항시',         lat: 36.019, lon: 129.344 },
  { name: '안동CC',         addr: '경북 안동시',         lat: 36.569, lon: 128.722 },
  { name: '구미CC',         addr: '경북 구미시',         lat: 36.119, lon: 128.348 },
  { name: '문경CC',         addr: '경북 문경시',         lat: 36.593, lon: 128.189 },
  { name: '상주CC',         addr: '경북 상주시',         lat: 36.411, lon: 128.159 },
  { name: '블루원상주GC',   aliases: ['블루원상주'],      addr: '경북 상주시',         lat: 36.383, lon: 128.108 },
  { name: '김천CC',         addr: '경북 김천시',         lat: 36.120, lon: 128.114 },
  { name: '예천CC',         addr: '경북 예천군',         lat: 36.653, lon: 128.494 },
  { name: '영주CC',         addr: '경북 영주시',         lat: 36.804, lon: 128.622 },
  { name: '봉화CC',         addr: '경북 봉화군',         lat: 36.893, lon: 128.731 },
  { name: '영덕CC',         addr: '경북 영덕군',         lat: 36.415, lon: 129.365 },
  { name: '청도CC',         addr: '경북 청도군',         lat: 35.647, lon: 128.730 },
  { name: '고령CC',         addr: '경북 고령군',         lat: 35.727, lon: 128.264 },
  { name: '의성CC',         addr: '경북 의성군',         lat: 36.352, lon: 128.697 },
  { name: '성주CC',         addr: '경북 성주군',         lat: 35.919, lon: 128.283 },
  { name: '칠곡CC',         addr: '경북 칠곡군',         lat: 35.985, lon: 128.400 },

  // ══════════════════════════════════════════
  // 부산·울산·경상남도
  // ══════════════════════════════════════════
  { name: '부산CC',              addr: '부산 북구',           lat: 35.281, lon: 129.019 },
  { name: '동래베네스트CC',      aliases: ['동래베네스트', '동래CC'], addr: '부산 동래구', lat: 35.221, lon: 129.041 },
  { name: '아시아드CC',          aliases: ['아시아드골프클럽'], addr: '부산 북구',        lat: 35.248, lon: 128.999 },
  { name: '롯데스카이힐부산CC',  aliases: ['롯데스카이힐부산'], addr: '부산 기장군',      lat: 35.219, lon: 129.241 },
  { name: '기장CC',              addr: '부산 기장군',                                      lat: 35.240, lon: 129.210 },
  { name: '울산CC',              addr: '울산 울주군',                                      lat: 35.579, lon: 129.113 },
  { name: '에덴밸리GC',          aliases: ['에덴밸리'],        addr: '경남 양산시',       lat: 35.421, lon: 129.037 },
  { name: '웅상CC',              addr: '경남 양산시',                                      lat: 35.361, lon: 129.101 },
  { name: '창원CC',              addr: '경남 창원시',                                      lat: 35.222, lon: 128.681 },
  { name: '가야CC',              aliases: ['가야컨트리클럽'],  addr: '경남 김해시',       lat: 35.499, lon: 128.481 },
  { name: '파인힐스CC',          aliases: ['파인힐스'],        addr: '경남 사천시',       lat: 35.143, lon: 128.921 },
  { name: '진주CC',              addr: '경남 진주시',                                      lat: 35.181, lon: 128.108 },
  { name: '통영CC',              addr: '경남 통영시',                                      lat: 34.862, lon: 128.431 },
  { name: '고성CC(경남)',         addr: '경남 고성군',                                      lat: 34.974, lon: 128.321 },
  { name: '남해CC',              addr: '경남 남해군',                                      lat: 34.836, lon: 128.018 },
  { name: '거제CC',              addr: '경남 거제시',                                      lat: 34.880, lon: 128.621 },
  { name: '합천CC',              addr: '경남 합천군',                                      lat: 35.567, lon: 128.165 },
  { name: '밀양CC',              addr: '경남 밀양시',                                      lat: 35.503, lon: 128.761 },
  { name: '함양CC',              addr: '경남 함양군',                                      lat: 35.519, lon: 127.717 },
  { name: '하동CC',              addr: '경남 하동군',                                      lat: 35.067, lon: 127.751 },
  { name: '산청CC',              addr: '경남 산청군',                                      lat: 35.412, lon: 127.873 },
  { name: '의령CC',              addr: '경남 의령군',                                      lat: 35.322, lon: 128.261 },

  // ══════════════════════════════════════════
  // 제주
  // ══════════════════════════════════════════
  { name: '나인브릿지CC',       aliases: ['나인브릿지', '클럽나인브릿지', '나인 브릿지'], addr: '제주 서귀포시 안덕면', lat: 33.390, lon: 126.321 },
  { name: '핀크스GC',           aliases: ['핀크스'],           addr: '제주 서귀포시 안덕면', lat: 33.281, lon: 126.357 },
  { name: '제주CC',             addr: '제주 제주시 조천읍',                                  lat: 33.460, lon: 126.491 },
  { name: '중문CC',             aliases: ['중문골프장'],        addr: '제주 서귀포시 중문동', lat: 33.249, lon: 126.413 },
  { name: '서귀포CC',           addr: '제주 서귀포시',                                       lat: 33.262, lon: 126.501 },
  { name: '한라CC',             addr: '제주 제주시',                                         lat: 33.452, lon: 126.562 },
  { name: '오라CC',             addr: '제주 제주시 오라동',                                  lat: 33.492, lon: 126.519 },
  { name: '해비치CC',           aliases: ['제주해비치', '해비치호텔GC', '해비치리조트GC'], addr: '제주 서귀포시 성산읍', lat: 33.419, lon: 126.919 },
  { name: '블랙스톤GC',         aliases: ['블랙스톤'],          addr: '제주 서귀포시 성산읍', lat: 33.431, lon: 126.921 },
  { name: '아덴힐CC',           aliases: ['아덴힐'],            addr: '제주 제주시 한림읍',  lat: 33.390, lon: 126.265 },
  { name: '라온GC',             aliases: ['라온골프클럽'],      addr: '제주 서귀포시',       lat: 33.302, lon: 126.351 },
  { name: '엘리시안제주GC',     aliases: ['엘리시안제주'],      addr: '제주 제주시 한림읍',  lat: 33.390, lon: 126.220 },
  { name: '롯데스카이힐제주CC', aliases: ['롯데스카이힐제주'],  addr: '제주 서귀포시 성산읍', lat: 33.418, lon: 126.901 },
  { name: '클럽디아일랜드CC',   aliases: ['디아일랜드'],        addr: '제주 서귀포시',       lat: 33.310, lon: 126.420 },
  { name: '제주파인힐GC',       aliases: ['파인힐제주'],        addr: '제주 서귀포시',       lat: 33.290, lon: 126.390 },
  { name: '히든클리프GC',       aliases: ['히든클리프'],        addr: '제주 서귀포시 안덕면', lat: 33.270, lon: 126.311 },
]

// ── 검색 노말라이즈 ──────────────────────────────────────────────
const STRIP_PATTERN = /\s*(컨트리클럽|골프클럽|리조트|골프장|CC|GC|gc|cc)\s*/gi

function normalize(s: string): string {
  return s.replace(STRIP_PATTERN, '').replace(/\s+/g, '').toLowerCase()
}

// ── LocationInfo 변환 (초기화 1회) ───────────────────────────────
export const GOLF_COURSES: LocationInfo[] = RAW.map(({ name, addr, lat, lon }) => {
  const { nx, ny } = latLonToGrid({ lat, lon })
  return { name, address: addr, lat, lon, nx, ny, terrain: 'golf' }
})

/**
 * 골프장 이름으로 검색 (부분 일치, 별칭 포함)
 * score: 3=완전일치  2=접두어  1=부분포함
 */
export function searchGolfCourses(query: string, limit = 5): LocationInfo[] {
  const q = normalize(query)
  if (!q) return []

  const scored: { loc: LocationInfo; score: number }[] = []

  for (let i = 0; i < RAW.length; i++) {
    const raw = RAW[i]
    const candidates = [raw.name, ...(raw.aliases ?? []), raw.addr]
    let best = 0

    for (const c of candidates) {
      const n = normalize(c)
      if (n === q)          { best = 3; break }
      if (n.startsWith(q))  { best = Math.max(best, 2) }
      else if (n.includes(q)) { best = Math.max(best, 1) }
    }

    if (best > 0) scored.push({ loc: GOLF_COURSES[i], score: best })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ loc }) => loc)
}

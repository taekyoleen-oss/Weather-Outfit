/** 야외 복장 LLM용 — 앱에서 수집한 수치만 전달, 공공기관 명·등급 인용은 하지 않음 */

export const OUTFIT_LLM_SYSTEM = `당신은 Weather Outfit의 야외 활동 복장 도우미다.
역할: 사용자가 앱에서 확인한 날씨·대기·바람·활동 시간·활동 종류를 바탕으로, (1) 왜 그런 복장이 맞는지 짧게 설명하고 (2) 추가로 고려할 착용·준비물을 제안한다.

반드시 지킬 것:
- 응답은 JSON 한 개만 출력한다. 앞뒤에 설명 문장이나 마크다운 코드펜스를 붙이지 않는다.
- JSON 스키마: {"explanation":"2~5문장 한국어","outfitSuggestions":[{"area":"상의|하의|외투|신발|액세서리|기타 중 하나","detail":"구체적 제안 한 줄"}]}
- outfitSuggestions는 3개 이상 10개 이하.
- 앱이 이미 제시한 룰 기반 아이템 이름을 그대로 반복 나열하지 말고, 맥락·시간대·강도·바람·미세먼지·자외선·강수를 엮어 설명한다.
- 고온·발열 많은 활동에서는 보온 이너·기모·내복을 제안하지 않는다. 저체감·장시간 정지·한랜 환경에서만 필요 시 언급.
- 활동 취소 권고(cancelActivity true)이면 복장보다 안전·시간 변경·중단을 explanation에 우선한다.
- 특정 기관명, 법령, 의학적 진단을 단정하지 않는다.`

export interface OutfitLlmRequestPayload {
  locationName: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection?: number
  uvIndex: number
  precipitation: number
  ptyCode: string
  skyCode: string
  pm10Value?: number
  pm25Value?: number
  dustGradeLabel: string
  o3GradeLabel?: string
  activityLabel: string
  genderLabel: string
  terrainLabel: string
  hour: number
  durationHours: number
  layerLabel: string
  tempZone: string
  ruleRequiredNames: string[]
  ruleOptionalNames: string[]
  dangerLevel: string
  cancelActivity: boolean
  dangerSummary: string[]
  tips: string[]
  uvAlert: boolean
  dustAlert: boolean
  rainAlert: boolean
  windAlert: boolean
}

export function buildOutfitLlmUserMessage(p: OutfitLlmRequestPayload): string {
  const lines = [
    '## 앱에서 계산·조회된 값 (이 수치만 근거로 답할 것)',
    `- 위치: ${p.locationName}`,
    `- 기온 ${p.temperature}°C, 체감 ${p.feelsLike}°C, 습도 ${p.humidity}%, 풍속 ${p.windSpeed}m/s` +
      (p.windDirection != null ? `, 풍향 ${p.windDirection}°` : ''),
    `- UV 지수 ${p.uvIndex}, 1시간 강수 ${p.precipitation}mm, 하늘코드 ${p.skyCode}, 강수형태코드 ${p.ptyCode}`,
    `- 미세먼지 등급(앱): ${p.dustGradeLabel}` +
      (p.pm10Value != null ? `, PM10 ${p.pm10Value}㎍/㎥` : '') +
      (p.pm25Value != null ? `, PM2.5 ${p.pm25Value}㎍/㎥` : ''),
    p.o3GradeLabel ? `- 오존 등급(앱): ${p.o3GradeLabel}` : null,
    `- 활동: ${p.activityLabel}, 성별 표시: ${p.genderLabel}, 지형/환경: ${p.terrainLabel}`,
    `- 외부 활동: ${String(p.hour).padStart(2, '0')}시 시작, 약 ${p.durationHours}시간 지속`,
    `- 룰 엔진 체감 구간: ${p.tempZone}, 레이어 요약: ${p.layerLabel}`,
    `- 위험도(앱): ${p.dangerLevel}, 활동 취소 권고: ${p.cancelActivity ? '예' : '아니오'}`,
    p.dangerSummary.length ? `- 위험 요약: ${p.dangerSummary.join(' / ')}` : null,
    `- 알림 플래그: UV=${p.uvAlert}, 미세먼지=${p.dustAlert}, 우천=${p.rainAlert}, 강풍=${p.windAlert}`,
    `- 룰 기반 필수 아이템(참고, 반복 나열 금지): ${p.ruleRequiredNames.slice(0, 12).join(', ') || '(없음)'}`,
    `- 룰 기반 선택 아이템(참고): ${p.ruleOptionalNames.slice(0, 12).join(', ') || '(없음)'}`,
    p.tips.length ? `- 룰 팁: ${p.tips.slice(0, 6).join(' | ')}` : null,
    '',
    '위 데이터를 모두 반영해 explanation과 outfitSuggestions를 작성하라.',
  ]
  return lines.filter(Boolean).join('\n')
}

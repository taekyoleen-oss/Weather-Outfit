/** 동적 복장 SVG: 상단 하늘·태양·날씨 데코용 여백 (user space) */
export const ILLUST_SKY_TOP = 56
export const ILLUST_VB_W = 200
export const ILLUST_VB_CONTENT_H = 240

export const ILLUST_VIEWBOX_HEIGHT = ILLUST_VB_CONTENT_H + ILLUST_SKY_TOP

/** `viewBox` 문자열 — y는 -ILLUST_SKY_TOP 부터 본문(0~240)까지 */
export function illustViewBoxString(): string {
  return `0 -${ILLUST_SKY_TOP} ${ILLUST_VB_W} ${ILLUST_VIEWBOX_HEIGHT}`
}

/** width 대비 표시 높이 비율 (픽셀 height = width * 이 값) */
export function illustDisplayHeightOverWidth(): number {
  return ILLUST_VIEWBOX_HEIGHT / ILLUST_VB_W
}

/**
 * 기상청 초단기실황·초단기예보 기반 현재기온 보정 + 관측소 매칭 메타.
 * 단기예보(getVilageFcst) 파이프라인은 유지하고, 이 모듈 결과로 current 기온·체감만 보강한다.
 */

import type { CurrentWeather, PtyCode, SkyCode } from '@/types/weather'
import type { TempZone } from '@/types/outfit'
import { feelsLike } from '@/lib/utils/formatWeather'
import { getTempZone, LAYER_LEVELS, TEMP_ZONE_LABELS } from '@/lib/outfit/rules'
import { TTL, kvOptionalGet, kvOptionalSet } from '@/lib/cache/kv'
import { matchNearestAsosStation } from '@/lib/weather/kma-asos-stations'
import {
  addDaysYmd,
  fetchUltraSrtFcstT1HAtSlot,
  fetchUltraSrtNcst,
  kstWallClock,
  parseNcstSurface,
} from '@/lib/weather/kma-ultra'

export type DataSourceTag =
  | 'ULTRA_NCST_CURRENT_HOUR'
  | 'ULTRA_NCST_PREV_HOUR'
  | 'ULTRA_FCST_CURRENT_HOUR'
  | 'BLEND_ISSUED_LATER'
  | 'VILAGE_SHORT_TERM_GRID'
  | 'KV_CACHED_SNAPSHOT'

export type LogicBranch = 'post_45_ncst' | 'pre_45_ncst_vs_fcst' | 'vilage_only' | 'cached_fallback'

export interface KmaOptimizationMeta {
  data_source: DataSourceTag
  logic_branch: LogicBranch
  base_date?: string
  base_time?: string
  fcst_date?: string
  fcst_time?: string
  /** base_date*1e6 + base_time(숫자) — 예보·실황 발표 시각 비교용 */
  issued_at_score?: number
  kst_hour: number
  kst_minute: number
  matched_station: {
    stn_id: string
    name: string
    lat: number
    lon: number
    distance_km: number
  }
  /** 격자는 기존 API와 동일 nx,ny 유지. 관측소는 정합성·표시용. */
  grid: { nx: number; ny: number }
  notes?: string
}

interface CachedOptimizationPayload {
  savedAt: number
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  meta: KmaOptimizationMeta
}

function scoreIssued(baseDate: string, baseTime: string): number {
  const bt = parseInt(baseTime.replace(/\D/g, ''), 10) || 0
  const bd = parseInt(baseDate, 10) || 0
  return bd * 1_000_000 + bt
}

function prevHourSlot(ymd: string, hour: number): { ymd: string; hour: number } {
  if (hour === 0) return { ymd: addDaysYmd(ymd, -1), hour: 23 }
  return { ymd, hour: hour - 1 }
}

async function tryNcstAtHour(
  nx: number,
  ny: number,
  ymd: string,
  hour: number
): Promise<
  | (ReturnType<typeof parseNcstSurface> & {
      baseDate: string
      baseTime: string
      issued_at_score: number
    })
  | null
> {
  const baseTime = String(hour).padStart(2, '0') + '00'
  const row = await fetchUltraSrtNcst(nx, ny, ymd, baseTime)
  if (!row) return null
  const s = parseNcstSurface(row)
  if (!Number.isFinite(s.temperature)) return null
  return {
    ...s,
    baseDate: ymd,
    baseTime,
    issued_at_score: scoreIssued(ymd, baseTime),
  }
}

function cacheKey(nx: number, ny: number): string {
  return `wm:lastopt:${nx}:${ny}`
}

export class WeatherManager {
  /**
   * 위경도·격자를 받아 초단기 실황/예보와 시각 분기로 현재기온 후보를 산출한다.
   * 실패 시 단기예보(vilage) baseline 또는 KV 스냅샷으로 폴백한다.
   */
  async optimizeCurrentTemperature(params: {
    nx: number
    ny: number
    lat: number
    lon: number
    vilageBaseline: CurrentWeather
  }): Promise<{
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    ptyCode: PtyCode
    meta: KmaOptimizationMeta
  }> {
    const { nx, ny, lat, lon, vilageBaseline: v } = params
    const station = matchNearestAsosStation(lat, lon)
    const clock = kstWallClock()
    const { ymd, hour: H, minute: M } = clock

    const baseMeta = (partial: Partial<KmaOptimizationMeta>): KmaOptimizationMeta => ({
      data_source: 'VILAGE_SHORT_TERM_GRID',
      logic_branch: 'vilage_only',
      kst_hour: H,
      kst_minute: M,
      matched_station: {
        stn_id: station.stn_id,
        name: station.name,
        lat: station.lat,
        lon: station.lon,
        distance_km: station.distance_km,
      },
      grid: { nx, ny },
      ...partial,
    })

    const fromVilage = () => ({
      temperature: v.temperature,
      feelsLike: v.feelsLike,
      humidity: v.humidity,
      windSpeed: v.windSpeed,
      ptyCode: v.ptyCode,
      meta: baseMeta({
        data_source: 'VILAGE_SHORT_TERM_GRID',
        logic_branch: 'vilage_only',
        notes: '초단기 API 미사용 또는 실패 — 단기예보 격자값',
      }),
    })

    let chosen:
      | {
          temperature: number
          humidity: number
          windSpeed: number
          ptyCode: PtyCode
          meta: KmaOptimizationMeta
        }
      | null = null

    try {
      if (M >= 45) {
        let nc = await tryNcstAtHour(nx, ny, ymd, H)
        if (!nc) {
          const ph = prevHourSlot(ymd, H)
          nc = await tryNcstAtHour(nx, ny, ph.ymd, ph.hour)
        }
        if (nc) {
          chosen = {
            temperature: nc.temperature,
            humidity: nc.humidity,
            windSpeed: nc.windSpeed,
            ptyCode: (nc.ptyCode ?? '0') as PtyCode,
            meta: baseMeta({
              data_source: 'ULTRA_NCST_CURRENT_HOUR',
              logic_branch: 'post_45_ncst',
              base_date: nc.baseDate,
              base_time: nc.baseTime,
              issued_at_score: nc.issued_at_score,
              notes: 'KST 분≥45 — 현재 시각 초단기실황(또는 직전 시각) 우선',
            }),
          }
        }
      } else {
        const ph = prevHourSlot(ymd, H)
        const [prevNc, fcH] = await Promise.all([
          tryNcstAtHour(nx, ny, ph.ymd, ph.hour),
          fetchUltraSrtFcstT1HAtSlot(nx, ny, ymd, H),
        ])

        if (prevNc && fcH) {
          const sNc = prevNc.issued_at_score
          const sFc = scoreIssued(fcH.baseDate, fcH.baseTime)
          const pickFc = sFc > sNc || sFc === sNc
          if (pickFc) {
            chosen = {
              temperature: fcH.t1h,
              humidity: v.humidity,
              windSpeed: v.windSpeed,
              ptyCode: v.ptyCode,
              meta: baseMeta({
                data_source: sFc > sNc ? 'BLEND_ISSUED_LATER' : 'ULTRA_FCST_CURRENT_HOUR',
                logic_branch: 'pre_45_ncst_vs_fcst',
                base_date: fcH.baseDate,
                base_time: fcH.baseTime,
                fcst_date: fcH.fcstDate,
                fcst_time: fcH.fcstTime,
                issued_at_score: sFc,
                notes:
                  sFc > sNc
                    ? 'KST 분<45 — 직전 실황 vs 현재시 초단기예보 중 base_date+base_time 수치가 더 큰(더 늦게 발표된) 쪽 우선'
                    : 'KST 분<45 — 동일·근접 발표 시각이면 현재 시각 예보(T1H) 사용',
              }),
            }
          } else {
            chosen = {
              temperature: prevNc.temperature,
              humidity: prevNc.humidity,
              windSpeed: prevNc.windSpeed,
              ptyCode: (prevNc.ptyCode ?? '0') as PtyCode,
              meta: baseMeta({
                data_source: 'ULTRA_NCST_PREV_HOUR',
                logic_branch: 'pre_45_ncst_vs_fcst',
                base_date: prevNc.baseDate,
                base_time: prevNc.baseTime,
                issued_at_score: sNc,
                notes: 'KST 분<45 — 직전 시각 실황이 더 최신 발표',
              }),
            }
          }
        } else if (fcH) {
          chosen = {
            temperature: fcH.t1h,
            humidity: v.humidity,
            windSpeed: v.windSpeed,
            ptyCode: v.ptyCode,
            meta: baseMeta({
              data_source: 'ULTRA_FCST_CURRENT_HOUR',
              logic_branch: 'pre_45_ncst_vs_fcst',
              base_date: fcH.baseDate,
              base_time: fcH.baseTime,
              fcst_date: fcH.fcstDate,
              fcst_time: fcH.fcstTime,
              issued_at_score: scoreIssued(fcH.baseDate, fcH.baseTime),
              notes: '직전 실황 없음 — 현재 시각 초단기예보만 사용',
            }),
          }
        } else if (prevNc) {
          chosen = {
            temperature: prevNc.temperature,
            humidity: prevNc.humidity,
            windSpeed: prevNc.windSpeed,
            ptyCode: (prevNc.ptyCode ?? '0') as PtyCode,
            meta: baseMeta({
              data_source: 'ULTRA_NCST_PREV_HOUR',
              logic_branch: 'pre_45_ncst_vs_fcst',
              base_date: prevNc.baseDate,
              base_time: prevNc.baseTime,
              issued_at_score: prevNc.issued_at_score,
              notes: '현재 시각 예보 없음 — 직전 시각 실황만 사용',
            }),
          }
        }
      }
    } catch {
      chosen = null
    }

    if (!chosen) {
      const snap = await kvOptionalGet<CachedOptimizationPayload>(cacheKey(nx, ny))
      if (snap && Number.isFinite(snap.temperature) && Date.now() - snap.savedAt < TTL.weatherManagerFallback * 1000) {
        const meta = {
          ...snap.meta,
          data_source: 'KV_CACHED_SNAPSHOT' as const,
          logic_branch: 'cached_fallback' as const,
          notes: `초단기 조회 실패 — ${new Date(snap.savedAt).toISOString()} 스냅샷`,
        }
        chosen = {
          temperature: snap.temperature,
          humidity: snap.humidity,
          windSpeed: snap.windSpeed,
          ptyCode: v.ptyCode,
          meta,
        }
      }
    }

    const out = chosen ?? fromVilage()
    const fl = feelsLike(out.temperature, out.windSpeed, out.humidity)

    const payload: CachedOptimizationPayload = {
      savedAt: Date.now(),
      temperature: out.temperature,
      feelsLike: fl,
      humidity: out.humidity,
      windSpeed: out.windSpeed,
      meta: out.meta,
    }
    if (out.meta.data_source !== 'KV_CACHED_SNAPSHOT' && out.meta.data_source !== 'VILAGE_SHORT_TERM_GRID') {
      void kvOptionalSet(cacheKey(nx, ny), payload, TTL.weatherManagerFallback)
    }

    return {
      temperature: out.temperature,
      feelsLike: fl,
      humidity: out.humidity,
      windSpeed: out.windSpeed,
      ptyCode: out.ptyCode,
      meta: out.meta,
    }
  }
}

/** 체감 기준 복장 온도대(앱 rules.ts 와 동일 구간) */
export function outfitCategoryFromTemperature(
  tempC: number,
  windMps?: number,
  humidityPct?: number
): {
  temp_zone: TempZone
  zone_label: string
  layer_level: number
  feels_like_c: number
} {
  const fl = feelsLike(tempC, windMps ?? 2, humidityPct ?? 50)
  const z = getTempZone(fl)
  return {
    temp_zone: z,
    zone_label: TEMP_ZONE_LABELS[z],
    layer_level: LAYER_LEVELS[z],
    feels_like_c: Math.round(fl * 10) / 10,
  }
}

/**
 * 사용자 위치(위·경도 + 격자) 입력 → 보정 기온·체감·Data_Source·복장 카테고리.
 * 격자 단기예보는 호출부에서 `vilageBaseline`으로 전달(기존 로직 유지).
 */
export async function getOptimizedWeatherForLocation(input: {
  lat: number
  lon: number
  nx: number
  ny: number
  vilageBaseline: CurrentWeather
}): Promise<{
  temperature: number
  feels_like_c: number
  humidity: number
  wind_speed_mps: number
  sky_code: SkyCode
  pty_code: PtyCode
  outfit: ReturnType<typeof outfitCategoryFromTemperature>
  optimization: KmaOptimizationMeta
}> {
  const wm = new WeatherManager()
  const o = await wm.optimizeCurrentTemperature(input)
  const outfit = outfitCategoryFromTemperature(o.temperature, o.windSpeed, o.humidity)
  return {
    temperature: o.temperature,
    feels_like_c: Math.round(o.feelsLike * 10) / 10,
    humidity: o.humidity,
    wind_speed_mps: o.windSpeed,
    sky_code: input.vilageBaseline.skyCode,
    pty_code: o.ptyCode,
    outfit,
    optimization: o.meta,
  }
}

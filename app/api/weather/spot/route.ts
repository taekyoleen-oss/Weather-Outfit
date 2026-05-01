import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  fetchUltraSrtNcst,
  fetchUltraSrtFcstSlots,
  kstWallClock,
  parseNcstSurface,
} from '@/lib/weather/kma-ultra'
import {
  fetchVilageForecastWithMap,
  vilageSlotAtHour,
  extractTmnTmxForDay,
} from '@/lib/weather/kma'
import { fetchLivingWeatherBundle } from '@/lib/weather/kma-living'
import { fetchWeatherAlerts } from '@/lib/weather/kma-alert'
import { resolveAreaNoByCoords } from '@/lib/location/areaCode'
import { gridToLatLon } from '@/lib/location/geoConvert'
import { kvSWR } from '@/lib/cache/kv'
import type { SkyCode, PtyCode, WeatherAlert } from '@/types/weather'
import { feelsLike } from '@/lib/utils/formatWeather'
import { recommendOutfit } from '@/lib/outfit/recommender'
import { computeGolfScore, type GolfScore } from '@/lib/spot/golfScore'
import { areaNoToWarnStnId } from '@/lib/spot/areaToWarnStn'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  nx: z.coerce.number().int().min(1).max(149),
  ny: z.coerce.number().int().min(1).max(253),
  lat: z.coerce.number().min(33).max(43).optional(),
  lon: z.coerce.number().min(124).max(132).optional(),
  name: z.string().max(80).optional(),
})

interface SpotHourlySlot {
  fcstYmd: string
  fcstHour: number
  temperature: number
  skyCode: SkyCode
  ptyCode: PtyCode
  precipitation: number
  windSpeed: number
  pop: number
  vecDeg: number
  feelsLikeC: number
  score: GolfScore
}

interface LivingIdxOut {
  value: number
  grade?: string
}

interface OutfitSummaryOut {
  layerLabel: string
  layerLevel: number
  items: { name: string; icon: string; category: string }[]
  tips: string[]
  dangerLevel: string
  cancelActivity: boolean
  dangerReasons: string[]
}

interface SpotResponse {
  spot: { name: string; address?: string; lat: number; lon: number; nx: number; ny: number }
  observed: {
    baseDate: string
    baseTime: string
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: number
    ptyCode: PtyCode
    rn1: number
  } | null
  /** 단기예보 기준 오늘 일 최저·최고 */
  tmnToday: number | null
  tmxToday: number | null
  hourly: SpotHourlySlot[]
  alerts: { type: string; level: string; message: string; isLightningRelated: boolean }[]
  indices: {
    uv: LivingIdxOut | null
    senTa: LivingIdxOut | null
    wct: LivingIdxOut | null
    airDiffusion: LivingIdxOut | null
  }
  scoreNow: GolfScore
  bestTeeHours: number[]
  outfit: OutfitSummaryOut | null
  fetchedAt: number
  error?: string
}

function nowNcstBaseTime(): { ymd: string; baseTime: string } {
  const { ymd, hour, minute } = kstWallClock()
  if (minute < 40 && hour > 0) {
    return { ymd, baseTime: String(hour - 1).padStart(2, '0') + '00' }
  }
  if (minute < 40 && hour === 0) {
    const u = new Date()
    const k = new Date(u.getTime() + 9 * 60 * 60 * 1000 - 86400000)
    const yy = k.getUTCFullYear()
    const mo = String(k.getUTCMonth() + 1).padStart(2, '0')
    const da = String(k.getUTCDate()).padStart(2, '0')
    return { ymd: `${yy}${mo}${da}`, baseTime: '2300' }
  }
  return { ymd, baseTime: String(hour).padStart(2, '0') + '00' }
}

function toSkyCode(v?: string): SkyCode {
  if (v === '1' || v === '3' || v === '4') return v
  return '1'
}
function toPtyCode(v?: string): PtyCode {
  if (v === '0' || v === '1' || v === '2' || v === '3' || v === '4') return v
  return '0'
}

function lightningFromAlerts(alerts: WeatherAlert[]): boolean {
  return alerts.some((a) => {
    const t = `${a.type ?? ''} ${a.message ?? ''}`
    return /낙뢰|뇌우|번개/.test(t)
  })
}

function popAtOrBeforeHour(
  hourly: { fcstDate?: string; time: string; pop: number }[],
  todayYmd: string,
  hour: number,
): number {
  let best = 0
  for (const h of hourly) {
    if (h.fcstDate !== todayYmd) continue
    const hh = parseInt(h.time.slice(0, 2), 10)
    if (Number.isNaN(hh)) continue
    if (hh <= hour) best = h.pop
  }
  return best
}

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = QuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '유효하지 않은 파라미터입니다. (nx, ny 필수)' },
      { status: 400 },
    )
  }
  let { nx, ny, lat, lon, name } = parsed.data
  if (lat == null || lon == null) {
    const g = gridToLatLon({ nx, ny })
    lat = g.lat
    lon = g.lon
  }

  try {
    const { ymd, baseTime } = nowNcstBaseTime()
    const { hour: kstHour, ymd: todayYmd } = kstWallClock()

    const cacheKey = `spot-golf:${nx}:${ny}:${todayYmd}:${kstHour}`
    const cacheTtlSec = 60

    const body = await kvSWR(cacheKey, cacheTtlSec, async (): Promise<SpotResponse> => {
      const [ncstRow, fcstBundle, vilage, areaNo] = await Promise.all([
        fetchUltraSrtNcst(nx, ny, ymd, baseTime).catch(() => null),
        fetchUltraSrtFcstSlots(nx, ny, 6).catch(() => null),
        fetchVilageForecastWithMap(nx, ny).catch(() => null),
        resolveAreaNoByCoords({ lat, lon, nx, ny }).catch(() => '1100000000'),
      ])

      const [living, rawAlerts] = await Promise.all([
        fetchLivingWeatherBundle(areaNo).catch(() => ({
          uv: null,
          senTa: null,
          wct: null,
          airDiffusion: null,
        })),
        fetchWeatherAlerts(areaNoToWarnStnId(areaNo)).catch(() => [] as WeatherAlert[]),
      ])

      const alerts = rawAlerts.map((a) => ({
        type: a.type,
        level: a.level,
        message: a.message,
        isLightningRelated: /낙뢰|뇌우|번개/.test(`${a.type} ${a.message}`),
      }))

      const hasLightning = lightningFromAlerts(rawAlerts)

      const observed: SpotResponse['observed'] = ncstRow
        ? (() => {
            const s = parseNcstSurface(ncstRow)
            if (!Number.isFinite(s.temperature)) return null
            const vec = vilage?.current.windDirection ?? 0
            return {
              baseDate: ymd,
              baseTime,
              temperature: s.temperature,
              humidity: s.humidity,
              windSpeed: s.windSpeed,
              windDirection: vec,
              ptyCode: toPtyCode(s.ptyCode),
              rn1: s.rn1,
            }
          })()
        : null

      const map = vilage?.map ?? {}
      const { tmn: tmnToday, tmx: tmxToday } = extractTmnTmxForDay(map, todayYmd)

      const uvVal =
        living.uv && Number.isFinite(living.uv.value)
          ? Math.round(living.uv.value)
          : Math.round(vilage?.current.uvIndex ?? 0)

      const popNow = vilage ? popAtOrBeforeHour(vilage.hourly, todayYmd, kstHour) : 0
      const visKm =
        vilage != null && vilage.current.visibility > 0
          ? vilage.current.visibility / 1000
          : null

      const feelsNow =
        observed != null
          ? feelsLike(observed.temperature, observed.windSpeed, observed.humidity)
          : 20

      const scoreNow = computeGolfScore({
        tempC: observed?.temperature ?? 20,
        feelsLikeC: feelsNow,
        windSpeedMs: observed?.windSpeed ?? 0,
        pop: popNow,
        rn1mm: observed?.rn1 ?? 0,
        ptyCode: observed?.ptyCode ?? '0',
        uvIndex: uvVal,
        visibilityKm: visKm,
        hasLightningAlert: hasLightning,
      })

      const hourly: SpotHourlySlot[] = (fcstBundle?.slots ?? []).map((slot) => {
        const fcstHour = parseInt(slot.fcstTime.slice(0, 2), 10)
        const vrow = vilageSlotAtHour(map, slot.fcstDate, fcstHour)
        const pop = parseFloat(vrow?.POP ?? '0')
        const vecDeg = parseFloat(vrow?.VEC ?? String(vilage?.current.windDirection ?? 0))
        const t1h = parseFloat(slot.T1H ?? 'NaN')
        const wsd = parseFloat(slot.WSD ?? '0')
        const reh = parseFloat(slot.REH ?? vrow?.REH ?? '50')
        const temp = Number.isFinite(t1h) ? t1h : parseFloat(vrow?.TMP ?? '0')
        const fl = feelsLike(temp, wsd, reh)
        const pty = toPtyCode(slot.PTY)
        const rn1 = (() => {
          const rawR = slot.RN1 ?? '0'
          const n = parseFloat(rawR)
          return Number.isFinite(n) ? n : 0
        })()
        const sc = computeGolfScore({
          tempC: temp,
          feelsLikeC: fl,
          windSpeedMs: wsd,
          pop,
          rn1mm: rn1,
          ptyCode: pty,
          uvIndex: uvVal,
          visibilityKm: visKm,
          hasLightningAlert: false,
        })
        return {
          fcstYmd: slot.fcstDate,
          fcstHour,
          temperature: temp,
          skyCode: toSkyCode(slot.SKY),
          ptyCode: pty,
          precipitation: rn1,
          windSpeed: wsd,
          pop,
          vecDeg,
          feelsLikeC: fl,
          score: sc,
        }
      })

      const sortedByScore = [...hourly].sort((a, b) => b.score.score - a.score.score)
      const bestTeeHours = sortedByScore.filter((h) => h.score.score >= 45).slice(0, 3).map((h) => h.fcstHour)

      let outfit: OutfitSummaryOut | null = null
      if (observed) {
        const o = recommendOutfit({
          temperature: observed.temperature,
          feelsLike: feelsNow,
          humidity: observed.humidity,
          windSpeed: observed.windSpeed,
          uvIndex: uvVal,
          ptyCode: observed.ptyCode,
          precipitation: observed.rn1,
          dustGrade: '2',
          activity: 'golf',
          gender: 'male',
          hour: kstHour,
          duration: 4,
          terrain: 'golf',
        })
        outfit = {
          layerLabel: o.layerLabel,
          layerLevel: o.layerLevel,
          items: o.items.slice(0, 10).map((i) => ({
            name: i.name,
            icon: i.icon,
            category: i.category,
          })),
          tips: o.tips.slice(0, 4),
          dangerLevel: o.dangerLevel,
          cancelActivity: o.cancelActivity,
          dangerReasons: o.dangerReasons.slice(0, 5),
        }
      }

      return {
        spot: {
          name: name ?? `${nx}, ${ny}`,
          lat,
          lon,
          nx,
          ny,
        },
        observed,
        tmnToday,
        tmxToday,
        hourly,
        alerts,
        indices: {
          uv: living.uv ? { value: living.uv.value, grade: living.uv.grade } : null,
          senTa: living.senTa ? { value: living.senTa.value, grade: living.senTa.grade } : null,
          wct: living.wct ? { value: living.wct.value, grade: living.wct.grade } : null,
          airDiffusion: living.airDiffusion
            ? { value: living.airDiffusion.value, grade: living.airDiffusion.grade }
            : null,
        },
        scoreNow,
        bestTeeHours,
        outfit,
        fetchedAt: Date.now(),
      }
    })

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (e) {
    const msg = (e as Error).message ?? 'unknown'
    return NextResponse.json(
      { error: `골프·라운드 정보 조회 실패: ${msg}` },
      { status: 502 },
    )
  }
}

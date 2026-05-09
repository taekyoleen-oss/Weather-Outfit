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
  fcstMinute: number
  temperature: number
  skyCode: SkyCode
  ptyCode: PtyCode
  precipitation: number
  windSpeed: number
  humidity: number
  lgt: number
  pop: number
  vecDeg: number
  feelsLikeC: number
  score: GolfScore
}

interface TenMinutePrecipSlot {
  minuteOffset: number
  timeKst: string
  precipProb: number
  precipMm: number
}

export interface TenMinuteFullSlot {
  minuteOffset: number
  timeKst: string
  temperature: number
  skyCode: string
  ptyCode: string
  precipitation: number
  windSpeed: number
  humidity: number
  lgt: number
}

interface LightningNow {
  level: 'none' | 'watch' | 'warning'
  message: string
  source: 'alert-derived'
}

interface MountainHourlyInfo {
  fcstYmd: string
  fcstHour: number
  tempC: number
  windMs: number
  pop: number
  visibilityKm: number | null
  level: 'good' | 'caution' | 'danger'
}

interface WildfireHourlyInfo {
  fcstYmd: string
  fcstHour: number
  score: number
  level: 'low' | 'moderate' | 'high' | 'very_high'
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
  strip10m: TenMinuteFullSlot[]
  observed: {
    baseDate: string
    baseTime: string
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: number
    skyCode: SkyCode
    ptyCode: PtyCode
    precipitation: number
    lgt: number
  } | null
  /** 단기예보 기준 오늘 일 최저·최고 */
  tmnToday: number | null
  tmxToday: number | null
  hourly: SpotHourlySlot[]
  precip10m: TenMinutePrecipSlot[]
  lightningNow: LightningNow
  mountainHourly: MountainHourlyInfo[]
  wildfireHourly: WildfireHourlyInfo[]
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

function addMinutesKst(hh: number, mm: number, deltaMin: number): { hh: number; mm: number } {
  const total = hh * 60 + mm + deltaMin
  const norm = ((total % 1440) + 1440) % 1440
  return { hh: Math.floor(norm / 60), mm: norm % 60 }
}

function two(n: number): string {
  return String(n).padStart(2, '0')
}

function makePrecip10m(
  nowHour: number,
  nowMinute: number,
  popNow: number,
  rn1Now: number,
  nextHourPop: number,
  nextHourRn1: number,
): TenMinutePrecipSlot[] {
  const out: TenMinutePrecipSlot[] = []
  for (let m = 0; m <= 60; m += 10) {
    const ratio = m / 60
    const pop = Math.round(popNow + (nextHourPop - popNow) * ratio)
    const mm = Math.max(0, rn1Now + (nextHourRn1 - rn1Now) * ratio)
    const t = addMinutesKst(nowHour, nowMinute, m)
    out.push({
      minuteOffset: m,
      timeKst: `${two(t.hh)}:${two(t.mm)}`,
      precipProb: Math.min(100, Math.max(0, pop)),
      precipMm: Math.round(mm * 10) / 10,
    })
  }
  return out
}

function buildTenMinuteStrip(
  kstHour: number,
  kstMinute: number,
  todayYmd: string,
  observed: SpotResponse['observed'],
  hourly: SpotHourlySlot[],
): TenMinuteFullSlot[] {
  interface Anchor {
    minOffset: number
    temperature: number
    skyCode: string
    ptyCode: string
    precipitation: number
    windSpeed: number
    humidity: number
    lgt: number
  }

  const anchors: Anchor[] = []
  const nowAbsMin = kstHour * 60 + kstMinute

  if (observed) {
    anchors.push({
      minOffset: 0,
      temperature: observed.temperature,
      skyCode: observed.skyCode,
      ptyCode: observed.ptyCode,
      precipitation: observed.precipitation,
      windSpeed: observed.windSpeed,
      humidity: observed.humidity,
      lgt: observed.lgt,
    })
  }

  for (const slot of hourly) {
    const slotDayDelta = slot.fcstYmd > todayYmd ? 1 : 0
    const slotAbsMin = slotDayDelta * 1440 + slot.fcstHour * 60 + slot.fcstMinute
    const offset = slotAbsMin - nowAbsMin
    if (offset <= 0) continue
    anchors.push({
      minOffset: offset,
      temperature: slot.temperature,
      skyCode: slot.skyCode,
      ptyCode: slot.ptyCode,
      precipitation: slot.precipitation,
      windSpeed: slot.windSpeed,
      humidity: slot.humidity,
      lgt: slot.lgt,
    })
  }

  if (anchors.length === 0) return []
  anchors.sort((a, b) => a.minOffset - b.minOffset)

  const lastOffset = anchors[anchors.length - 1]!.minOffset
  const maxOffset = Math.min(lastOffset, 360)

  const out: TenMinuteFullSlot[] = []
  for (let tick = 0; tick <= maxOffset; tick += 10) {
    let prevIdx = 0
    for (let i = 0; i < anchors.length; i++) {
      if (anchors[i]!.minOffset <= tick) prevIdx = i
      else break
    }
    const nextIdx = Math.min(prevIdx + 1, anchors.length - 1)
    const prev = anchors[prevIdx]!
    const next = anchors[nextIdx]!

    let ratio = 0
    const span = next.minOffset - prev.minOffset
    if (span > 0 && nextIdx !== prevIdx) ratio = (tick - prev.minOffset) / span

    const lerp = (a: number, b: number) => a + ratio * (b - a)
    const t = addMinutesKst(kstHour, kstMinute, tick)
    out.push({
      minuteOffset: tick,
      timeKst: `${two(t.hh)}:${two(t.mm)}`,
      temperature: Math.round(lerp(prev.temperature, next.temperature) * 10) / 10,
      skyCode: prev.skyCode,
      ptyCode: prev.ptyCode,
      precipitation: Math.max(0, Math.round(lerp(prev.precipitation, next.precipitation) * 10) / 10),
      windSpeed: Math.round(lerp(prev.windSpeed, next.windSpeed) * 10) / 10,
      humidity: Math.round(lerp(prev.humidity, next.humidity)),
      lgt: prev.lgt,
    })
  }

  return out
}

function wildfireLevel(score: number): WildfireHourlyInfo['level'] {
  if (score >= 80) return 'very_high'
  if (score >= 60) return 'high'
  if (score >= 35) return 'moderate'
  return 'low'
}

function mountainLevel(input: { windMs: number; pop: number; visibilityKm: number | null }): MountainHourlyInfo['level'] {
  if (input.windMs >= 9 || input.pop >= 70 || (input.visibilityKm != null && input.visibilityKm < 2)) return 'danger'
  if (input.windMs >= 6 || input.pop >= 40 || (input.visibilityKm != null && input.visibilityKm < 5)) return 'caution'
  return 'good'
}

function wildfireScore(input: { tempC: number; humidity: number; windMs: number; precipMm: number; ptyCode: PtyCode }): number {
  let score = 0
  if (input.tempC >= 30) score += 25
  else if (input.tempC >= 25) score += 16
  else if (input.tempC >= 20) score += 8

  if (input.humidity < 25) score += 30
  else if (input.humidity < 35) score += 20
  else if (input.humidity < 45) score += 12

  if (input.windMs >= 9) score += 26
  else if (input.windMs >= 7) score += 18
  else if (input.windMs >= 5) score += 10

  if (input.ptyCode !== '0' || input.precipMm > 0.2) score -= 28
  else if (input.precipMm > 0.0) score -= 14

  return Math.max(0, Math.min(100, Math.round(score)))
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
    const { hour: kstHour, minute: kstMinute, ymd: todayYmd } = kstWallClock()

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
              skyCode: toSkyCode(vilage?.current.skyCode),
              ptyCode: toPtyCode(s.ptyCode),
              precipitation: s.rn1,
              lgt: s.lgt,
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
        rn1mm: observed?.precipitation ?? 0,
        ptyCode: observed?.ptyCode ?? '0',
        uvIndex: uvVal,
        visibilityKm: visKm,
        hasLightningAlert: hasLightning,
      })

      const hourly: SpotHourlySlot[] = (fcstBundle?.slots ?? []).map((slot) => {
        const fcstHour = parseInt(slot.fcstTime.slice(0, 2), 10)
        const fcstMinute = parseInt(slot.fcstTime.slice(2, 4), 10) || 0
        const vrow = vilageSlotAtHour(map, slot.fcstDate, fcstHour)
        const pop = parseFloat(vrow?.POP ?? '0')
        const vecDeg = parseFloat(vrow?.VEC ?? String(vilage?.current.windDirection ?? 0))
        const t1h = parseFloat(slot.T1H ?? 'NaN')
        const wsd = parseFloat(slot.WSD ?? '0')
        const reh = parseFloat(slot.REH ?? vrow?.REH ?? '50')
        const temp = Number.isFinite(t1h) ? t1h : parseFloat(vrow?.TMP ?? '0')
        const fl = feelsLike(temp, wsd, reh)
        const pty = toPtyCode(slot.PTY)
        const lgt = parseFloat(slot.LGT ?? '0') || 0
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
          fcstMinute,
          temperature: temp,
          skyCode: toSkyCode(slot.SKY),
          ptyCode: pty,
          precipitation: rn1,
          windSpeed: wsd,
          humidity: reh,
          lgt,
          pop,
          vecDeg,
          feelsLikeC: fl,
          score: sc,
        }
      })

      const sortedByScore = [...hourly].sort((a, b) => b.score.score - a.score.score)
      const bestTeeHours = sortedByScore.filter((h) => h.score.score >= 45).slice(0, 3).map((h) => h.fcstHour)

      const lightningNow: LightningNow = hasLightning
        ? {
            level: 'warning',
            message: '현재 지역(시·도 근사)에 낙뢰/뇌우 관련 특보가 감지되었습니다.',
            source: 'alert-derived',
          }
        : {
            level: popNow >= 60 || observed?.ptyCode !== '0' ? 'watch' : 'none',
            message:
              popNow >= 60 || observed?.ptyCode !== '0'
                ? '강수/대류 가능성이 있어 낙뢰 발생 가능성에 주의하세요.'
                : '낙뢰 관련 특보는 현재 확인되지 않습니다.',
            source: 'alert-derived',
          }

      const strip10m = buildTenMinuteStrip(kstHour, kstMinute, todayYmd, observed, hourly)

      const nextHour = hourly[0]
      const precip10m = makePrecip10m(
        kstHour,
        kstMinute,
        popNow,
        observed?.precipitation ?? 0,
        nextHour?.pop ?? popNow,
        nextHour?.precipitation ?? observed?.precipitation ?? 0,
      )

      const mountainHourly: MountainHourlyInfo[] = hourly.slice(0, 6).map((h) => {
        const lvl = mountainLevel({
          windMs: h.windSpeed,
          pop: h.pop,
          visibilityKm: visKm,
        })
        return {
          fcstYmd: h.fcstYmd,
          fcstHour: h.fcstHour,
          tempC: h.temperature,
          windMs: h.windSpeed,
          pop: h.pop,
          visibilityKm: visKm,
          level: lvl,
        }
      })

      const wildfireHourly: WildfireHourlyInfo[] = (fcstBundle?.slots ?? []).slice(0, 6).map((slot, i) => {
        const pty = toPtyCode(slot.PTY)
        const reh = parseFloat(slot.REH ?? '50')
        const temp = parseFloat(slot.T1H ?? '0')
        const wsd = parseFloat(slot.WSD ?? '0')
        const rn1 = parseFloat(slot.RN1 ?? '0')
        const score = wildfireScore({
          tempC: Number.isFinite(temp) ? temp : 0,
          humidity: Number.isFinite(reh) ? reh : 50,
          windMs: Number.isFinite(wsd) ? wsd : 0,
          precipMm: Number.isFinite(rn1) ? rn1 : 0,
          ptyCode: pty,
        })
        return {
          fcstYmd: slot.fcstDate,
          fcstHour: parseInt(slot.fcstTime.slice(0, 2), 10),
          score,
          level: wildfireLevel(score),
        }
      }).filter((v, i) => Number.isFinite(v.fcstHour) && i >= 0)

      let outfit: OutfitSummaryOut | null = null
      if (observed) {
        const o = recommendOutfit({
          temperature: observed.temperature,
          feelsLike: feelsNow,
          humidity: observed.humidity,
          windSpeed: observed.windSpeed,
          uvIndex: uvVal,
          ptyCode: observed.ptyCode,
          precipitation: observed.precipitation,
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
        strip10m,
        observed,
        tmnToday,
        tmxToday,
        hourly,
        precip10m,
        lightningNow,
        mountainHourly,
        wildfireHourly,
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

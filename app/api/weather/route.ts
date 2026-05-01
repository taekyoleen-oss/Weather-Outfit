import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchVilageForecast, getBaseDateTime, kstNow } from '@/lib/weather/kma'
import { kvSWR, TTL } from '@/lib/cache/kv'
import { reverseGeocode } from '@/lib/location/kakao'
import { getOptimizedWeatherForLocation } from '@/lib/weather/weather-manager'

const QuerySchema = z.object({
  nx: z.coerce.number().int().min(1).max(149),
  ny: z.coerce.number().int().min(1).max(253),
  lat: z.coerce.number().min(33).max(43),
  lon: z.coerce.number().min(124).max(132),
  name: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = QuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: '유효하지 않은 파라미터입니다.' }, { status: 400 })
  }
  const { nx, ny, lat, lon, name: nameParam } = parsed.data

  try {
    const { baseTime } = getBaseDateTime(kstNow())
    const baseHour = parseInt(baseTime.slice(0, 2), 10)
    const key = `vfcst2:${nx}:${ny}:${baseHour}`

    // [vilage fetch + reverse geocode] 병렬 → 이후 optimization (vilage 의존)
    const [data, locationName] = await Promise.all([
      kvSWR(key, TTL.shortForecast, () => fetchVilageForecast(nx, ny)),
      (async () => {
        if (nameParam) return nameParam
        try { return await reverseGeocode(lat, lon) } catch { return `${nx}, ${ny}` }
      })(),
    ])

    data.current.location = locationName

    let body: Record<string, unknown> = { ...data, fetchedAt: data.current.fetchedAt }
    try {
      const normalized = await getOptimizedWeatherForLocation({
        lat,
        lon,
        nx,
        ny,
        vilageBaseline: data.current,
      })
      data.current = {
        ...data.current,
        temperature: normalized.temperature,
        feelsLike: normalized.feels_like_c,
        humidity: normalized.humidity,
        windSpeed: normalized.wind_speed_mps,
        ptyCode: normalized.pty_code,
      }
      body = {
        ...data,
        fetchedAt: data.current.fetchedAt,
        kma_normalized: {
          temperature_c: normalized.temperature,
          feels_like_c: normalized.feels_like_c,
          data_source: normalized.optimization.data_source,
          logic_branch: normalized.optimization.logic_branch,
          base_date: normalized.optimization.base_date,
          base_time: normalized.optimization.base_time,
          fcst_date: normalized.optimization.fcst_date,
          fcst_time: normalized.optimization.fcst_time,
          issued_at_score: normalized.optimization.issued_at_score,
          kst: { hour: normalized.optimization.kst_hour, minute: normalized.optimization.kst_minute },
          matched_station: normalized.optimization.matched_station,
          grid: normalized.optimization.grid,
          notes: normalized.optimization.notes,
          outfit_hint: normalized.outfit,
        },
      }
    } catch (optErr) {
      console.warn('[weather] KMA optimization skipped:', optErr)
    }

    const res = NextResponse.json(body)
    res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
    return res
  } catch (err) {
    console.error('Weather API error:', err)
    return NextResponse.json({ error: '날씨 데이터를 불러오지 못했습니다.' }, { status: 500 })
  }
}

import { Redis } from '@upstash/redis'

let _kv: Redis | null = null

function getKv(): Redis | null {
  if (_kv) return _kv
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  _kv = new Redis({ url, token })
  return _kv
}

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

async function backgroundRevalidate<T>(key: string, ttlSec: number, fetcher: () => Promise<T>) {
  try {
    const data = await fetcher()
    const kv = getKv()
    if (kv) {
      await kv.set(key, { data, expiresAt: Date.now() + ttlSec * 1000 }, { ex: ttlSec * 2 })
    }
  } catch {
    // background revalidation failure is silent
  }
}

export async function kvSWR<T>(key: string, ttlSec: number, fetcher: () => Promise<T>): Promise<T> {
  const kv = getKv()
  if (!kv) {
    return fetcher()
  }

  try {
    const cached = await kv.get<CacheEntry<T>>(key)
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        return cached.data
      }
      // stale: return immediately, revalidate in background
      backgroundRevalidate(key, ttlSec, fetcher)
      return cached.data
    }
  } catch {
    // cache miss on error
  }

  const data = await fetcher()
  try {
    const kv2 = getKv()
    if (kv2) {
      await kv2.set(key, { data, expiresAt: Date.now() + ttlSec * 1000 }, { ex: ttlSec * 2 })
    }
  } catch {
    // cache write failure is non-fatal
  }
  return data
}

export const TTL = {
  shortForecast: 30 * 60,
  midForecast: 6 * 60 * 60,
  riseset: 24 * 60 * 60,
  alert: 5 * 60,
  dust: 60 * 60,
  aiComment: 60 * 60,
  /** WeatherManager 초단기 실패 시 마지막 성공 스냅샷 */
  weatherManagerFallback: 24 * 60 * 60,
} as const

export async function kvOptionalGet<T>(key: string): Promise<T | null> {
  const kv = getKv()
  if (!kv) return null
  try {
    return await kv.get<T>(key)
  } catch {
    return null
  }
}

export async function kvOptionalSet<T>(key: string, value: T, exSeconds: number): Promise<void> {
  const kv = getKv()
  if (!kv) return
  try {
    await kv.set(key, value, { ex: exSeconds })
  } catch {
    // non-fatal
  }
}

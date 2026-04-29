import type { PollenData, PollenSpeciesRisk } from '@/types/weather'

const BASE = 'https://apis.data.go.kr/1360000/HealthWthrIdxServiceV3'

type Species = PollenSpeciesRisk['species']

const SPECIES_ENDPOINT: Record<Species, string> = {
  oak: 'getOakPollenRiskIdxV3',
  pine: 'getPinePollenRiskIdxV3',
  weeds: 'getWeedsPollenRiskndxV3',
}

function currentKstDateHour() {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const yyyy = kst.getUTCFullYear()
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(kst.getUTCDate()).padStart(2, '0')
  const hh = kst.getUTCHours()
  return { ymd: `${yyyy}${mm}${dd}`, hour: hh, month: Number(mm) }
}

function latestAnnouncementTimeKst(): string {
  const { ymd, hour } = currentKstDateHour()
  const slot = hour >= 18 ? '18' : '06'
  return `${ymd}${slot}`
}

function parseRisk(item: Record<string, unknown>): number | undefined {
  const preferred = ['today', 'todayRisk', 'todayIdx', 'todayPollenRiskIdx']
  for (const key of preferred) {
    const v = item[key]
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  for (const [key, v] of Object.entries(item)) {
    if (!/today|금일|오늘/i.test(key)) continue
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

async function fetchSpeciesRisk(args: {
  serviceKey: string
  areaNo: string
  time: string
  species: Species
}): Promise<PollenSpeciesRisk> {
  const { serviceKey, areaNo, time, species } = args
  const candidates = Array.from(
    new Set([areaNo, `${areaNo.slice(0, 5)}00000`, `${areaNo.slice(0, 2)}00000000`, '1100000000'])
  )

  for (const areaCandidate of candidates) {
    const params = new URLSearchParams({
      serviceKey: decodeURIComponent(serviceKey),
      pageNo: '1',
      numOfRows: '10',
      dataType: 'JSON',
      areaNo: areaCandidate,
      time,
    })
    const url = `${BASE}/${SPECIES_ENDPOINT[species]}?${params}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) continue
    const json = await res.json()
    const itemNode = json?.response?.body?.items?.item as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | undefined
    const first = Array.isArray(itemNode) ? itemNode[0] : itemNode
    if (!first) continue
    const risk = parseRisk(first)
    if (typeof risk === 'number') return { species, todayRisk: risk }
  }

  return { species }
}

function activeSpeciesByMonth(month: number): Species[] {
  if (month >= 4 && month <= 6) return ['oak', 'pine']
  if (month >= 8 && month <= 10) return ['weeds']
  return ['oak', 'pine', 'weeds']
}

export async function fetchPollen(args: {
  areaNo: string
}): Promise<PollenData> {
  const serviceKey = process.env.KMA_HEALTH_IDX_SERVICE_KEY
  if (!serviceKey) throw new Error('KMA_HEALTH_IDX_SERVICE_KEY not set')
  const { month } = currentKstDateHour()
  const time = latestAnnouncementTimeKst()
  const species = activeSpeciesByMonth(month)

  const risks = await Promise.all(
    species.map((s) => fetchSpeciesRisk({ serviceKey, areaNo: args.areaNo, time, species: s }))
  )

  return {
    areaNo: args.areaNo,
    announcedAt: time,
    seasonActive: month >= 4 && month <= 10,
    risks,
    fetchedAt: Date.now(),
  }
}


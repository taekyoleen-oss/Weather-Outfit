import path from 'node:path'
import { readFile } from 'node:fs/promises'

interface DfsZoneRow {
  areaNo: string
  nx: number
  ny: number
  lon: number
  lat: number
}

const DEFAULT_AREA_NO = '1100000000'

/** 프로젝트 루트 `data/dfs-zone-tree_excel.csv` — Turbopack NFT 추적 완화용 주석 */
function defaultDfsCsvPath(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), 'data', 'dfs-zone-tree_excel.csv')
}

let zoneRowsCache: DfsZoneRow[] | null = null

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

async function loadZoneRows(): Promise<DfsZoneRow[]> {
  if (zoneRowsCache) return zoneRowsCache
  const csvPath = process.env.DFS_ZONE_CSV_PATH ?? defaultDfsCsvPath()

  try {
    const raw = await readFile(csvPath, 'utf8')
    const lines = raw.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) {
      zoneRowsCache = []
      return zoneRowsCache
    }

    const header = splitCsvLine(lines[0])
    const idxArea = header.indexOf('행정구역코드')
    const idxNx = header.indexOf('격자 X')
    const idxNy = header.indexOf('격자 Y')
    const idxLon = header.indexOf('경도(초/100)')
    const idxLat = header.indexOf('위도(초/100)')
    if (idxArea < 0 || idxNx < 0 || idxNy < 0 || idxLon < 0 || idxLat < 0) {
      zoneRowsCache = []
      return zoneRowsCache
    }

    const rows: DfsZoneRow[] = []
    for (let i = 1; i < lines.length; i += 1) {
      const cols = splitCsvLine(lines[i])
      const areaNo = cols[idxArea]
      const nx = Number(cols[idxNx])
      const ny = Number(cols[idxNy])
      const lon = Number(cols[idxLon])
      const lat = Number(cols[idxLat])
      if (!areaNo || !Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(lon) || !Number.isFinite(lat)) {
        continue
      }
      rows.push({ areaNo, nx, ny, lon, lat })
    }

    zoneRowsCache = rows
    return zoneRowsCache
  } catch {
    zoneRowsCache = []
    return zoneRowsCache
  }
}

export async function resolveAreaNoByCoords(args: {
  lat: number
  lon: number
  nx: number
  ny: number
}): Promise<string> {
  const { lat, lon, nx, ny } = args
  const key = process.env.KAKAO_LOCAL_API_KEY
  if (key) {
    try {
      const res = await fetch(`https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lon}&y=${lat}`, {
        headers: { Authorization: `KakaoAK ${key}` },
        cache: 'no-store',
      })
      if (res.ok) {
        const json = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs = (json?.documents ?? []) as any[]
        const h = docs.find((d) => d.region_type === 'H')
        const code = h?.code as string | undefined
        if (typeof code === 'string' && code.length >= 10) return code.slice(0, 10)
      }
    } catch {
      // fall through to DFS csv fallback
    }
  }

  try {
    const rows = await loadZoneRows()
    if (!rows.length) return DEFAULT_AREA_NO
    const sameGrid = rows.filter((r) => r.nx === nx && r.ny === ny)
    const candidates = sameGrid.length ? sameGrid : rows
    let best = candidates[0]
    let bestDist = Number.POSITIVE_INFINITY
    for (const r of candidates) {
      const dLon = r.lon - lon
      const dLat = r.lat - lat
      const dist = dLon * dLon + dLat * dLat
      if (dist < bestDist) {
        bestDist = dist
        best = r
      }
    }
    return best?.areaNo || DEFAULT_AREA_NO
  } catch {
    return DEFAULT_AREA_NO
  }
}

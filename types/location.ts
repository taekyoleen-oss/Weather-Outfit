export interface GeoCoords {
  lat: number
  lon: number
}

export interface GridCoords {
  nx: number
  ny: number
}

export interface LocationInfo {
  name: string
  address?: string
  lat: number
  lon: number
  nx: number
  ny: number
  terrain?: TerrainType
}

export type TerrainType =
  | 'urban'
  | 'mountain'
  | 'coastal'
  | 'river'
  | 'golf'
  | 'park'
  | 'indoor'

export interface KakaoSearchResult {
  place_name: string
  address_name: string
  road_address_name: string
  x: string
  y: string
  category_group_code: string
  category_name: string
}

export interface RecentLocation {
  name: string
  address?: string
  lat: number
  lon: number
  nx: number
  ny: number
  terrain?: TerrainType
  usedAt: number
}

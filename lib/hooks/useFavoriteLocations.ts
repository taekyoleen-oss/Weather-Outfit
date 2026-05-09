'use client'

import { useState, useCallback, useEffect } from 'react'
import type { LocationInfo } from '@/types/location'

const STORAGE_KEY = 'weatherfit:favorites'
const MAX = 8

function load(): LocationInfo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LocationInfo[]) : []
  } catch { return [] }
}

function persist(list: LocationInfo[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

export function useFavoriteLocations() {
  const [favorites, setFavorites] = useState<LocationInfo[]>([])

  useEffect(() => { setFavorites(load()) }, [])

  const addFavorite = useCallback((loc: LocationInfo) => {
    setFavorites(prev => {
      const next = [loc, ...prev.filter(f => f.name !== loc.name)].slice(0, MAX)
      persist(next)
      return next
    })
  }, [])

  const removeFavorite = useCallback((name: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.name !== name)
      persist(next)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (name: string) => favorites.some(f => f.name === name),
    [favorites],
  )

  return { favorites, addFavorite, removeFavorite, isFavorite }
}

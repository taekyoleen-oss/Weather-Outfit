'use client'

import { useState, useCallback, useEffect } from 'react'

export type CompanionProfile = 'solo' | 'child' | 'senior' | 'pet'

export const COMPANION_PROFILES: { key: CompanionProfile; emoji: string; label: string }[] = [
  { key: 'solo',   emoji: '🚶', label: '혼자' },
  { key: 'child',  emoji: '👶', label: '아이와' },
  { key: 'senior', emoji: '👴', label: '어르신과' },
  { key: 'pet',    emoji: '🐾', label: '반려동물과' },
]

const STORAGE_KEY = 'weatherfit:companionProfile'
const VALID: CompanionProfile[] = ['solo', 'child', 'senior', 'pet']

export function useCompanionProfile() {
  const [profile, setProfileState] = useState<CompanionProfile>('solo')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) as CompanionProfile | null
      if (raw && VALID.includes(raw)) setProfileState(raw)
    } catch {}
  }, [])

  const setProfile = useCallback((p: CompanionProfile) => {
    setProfileState(p)
    try { localStorage.setItem(STORAGE_KEY, p) } catch {}
  }, [])

  return { profile, setProfile }
}

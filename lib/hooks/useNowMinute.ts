'use client'

import { useState, useEffect } from 'react'
import { currentHourKst } from '@/lib/utils/timeOfDay'

export function useNowMinute(): number {
  const [hourKst, setHourKst] = useState(() => currentHourKst())

  useEffect(() => {
    const id = setInterval(() => setHourKst(currentHourKst()), 60_000)
    return () => clearInterval(id)
  }, [])

  return hourKst
}

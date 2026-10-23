import { useEffect, useState } from 'react'

// Small per-viewer preference (mode, exam direction)
export function usePref(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? fallback
    } catch {
      return fallback
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  }, [key, value])
  return [value, setValue]
}

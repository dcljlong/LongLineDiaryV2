import { useEffect, useMemo, useState } from 'react'
import { THEMES } from '@/lib/theme-themes'

export type ThemeId =
  | 'ceilings-light'
  | 'ceilings-dark'
  | 'future-grid'
  | 'ivory-corporate'
  | 'graphite-pro'

const STORAGE_KEY = 'lld-theme'

function isDark(t: ThemeId) {
  return t === 'ceilings-dark' || t === 'graphite-pro' || t === 'future-grid'
}

function safeTheme(v: string | null): ThemeId | null {
  if (!v) return null
  const allowed: ThemeId[] = [
    'ceilings-light',
    'ceilings-dark',
    'future-grid',
    'ivory-corporate',
    'graphite-pro'
  ]
  return (allowed as string[]).includes(v) ? (v as ThemeId) : null
}

function applyTheme(theme: ThemeId) {
  const root = document.documentElement
  const def = THEMES.find(t => t.id === theme)
  if (!def) return

  root.dataset.theme = theme

  if (def.mode === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')

  for (const [k, v] of Object.entries(def.tokens)) {
    root.style.setProperty(k, v)
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>('ceilings-dark')

  useEffect(() => {
    const stored = safeTheme(localStorage.getItem(STORAGE_KEY))
    const initial: ThemeId = stored ?? 'ceilings-dark'

    setThemeState(initial)
    applyTheme(initial)
    localStorage.setItem(STORAGE_KEY, initial)
  }, [])

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  }

  const toggle = () => {
    if (theme === 'ceilings-dark') {
      setTheme('ceilings-light')
    } else {
      setTheme('ceilings-dark')
    }
  }

  const isDarkMode = useMemo(() => isDark(theme), [theme])

  return { theme, setTheme, toggle, isDark: isDarkMode }
}

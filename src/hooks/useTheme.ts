import { useEffect, useMemo, useState } from 'react'

export type ThemeId =
  | 'dark-navy'
  | 'dark-charcoal'
  | 'light-soft'
  | 'light-blue'
  | 'light-green'
  | 'light-contrast'

const KEY_NEW = 'lld-theme'
const KEY_OLD = 'theme'

function isDark(t: ThemeId) {
  return t.startsWith('dark-')
}

function safeTheme(v: string | null): ThemeId | null {
  if (!v) return null
  const allowed: ThemeId[] = ['dark-navy','dark-charcoal','light-soft','light-blue','light-green','light-contrast']
  return (allowed as string[]).includes(v) ? (v as ThemeId) : null
}

function applyTheme(theme: ThemeId) {
  const root = document.documentElement

  // dataset drives token overrides
  root.dataset.theme = theme

  // dark class drives shadcn dark selectors
  if (isDark(theme)) root.classList.add('dark')
  else root.classList.remove('dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>('dark-navy')

  useEffect(() => {
    // migrate old key if present
    const migrated = safeTheme(localStorage.getItem(KEY_NEW)) ?? safeTheme(localStorage.getItem(KEY_OLD))
    const initial: ThemeId = migrated ?? 'dark-navy'

    setThemeState(initial)
    applyTheme(initial)

    // ensure persisted in new key
    localStorage.setItem(KEY_NEW, initial)
  }, [])

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    localStorage.setItem(KEY_NEW, t)
    applyTheme(t)
  }

  const toggle = () => {
    // toggle between current dark + last light (remembered), default light-soft
    const lastLight = safeTheme(localStorage.getItem('lld-last-light')) ?? 'light-soft'
    if (isDark(theme)) {
      setTheme(lastLight)
    } else {
      localStorage.setItem('lld-last-light', theme)
      setTheme('dark-navy')
    }
  }

  const isDarkMode = useMemo(() => isDark(theme), [theme])

  return { theme, setTheme, toggle, isDark: isDarkMode }
}

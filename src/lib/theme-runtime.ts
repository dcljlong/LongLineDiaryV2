import { THEMES, applyTheme, getThemeById, type ThemeDef } from "./theme-themes"

const STORAGE_KEY = "lld.themeId"

export function getSavedThemeId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

export function saveThemeId(id: string): void {
  try { localStorage.setItem(STORAGE_KEY, id) } catch { /* ignore */ }
}

export function getDefaultTheme(): ThemeDef {
  // Deterministic default: first theme in registry
  return THEMES[0]
}

export function applyThemeById(id: string): ThemeDef {
  const t = getThemeById(id) ?? getDefaultTheme()
  applyTheme(t)
  saveThemeId(t.id)
  return t
}

export function initTheme(): ThemeDef {
  const saved = getSavedThemeId()
  const t = (saved && getThemeById(saved)) ? getThemeById(saved)! : getDefaultTheme()
  applyTheme(t)
  // do not overwrite storage on init unless key missing
  if (!saved) saveThemeId(t.id)
  return t
}

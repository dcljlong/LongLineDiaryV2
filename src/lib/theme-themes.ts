import { PALETTE_SOURCES } from "./theme-palette-source"

export type ThemeMode = "light" | "dark"

export type ThemeDef = {
  id: string
  name: string
  mode: ThemeMode
  tokens: Record<string, string> // CSS vars: "--primary": "H S% L%" etc
}

/**
 * Ordered palette mapping (hierarchy as supplied by user):
 * For 5+ colors: [1 primary, 2 secondary/accent, 3 foreground/text hint, 4 surface/card, 5 background, 6 border (opt), 7 destructive (opt)]
 * For 3 colors: [1 primary, 2 secondary/accent, 3 background]; surface/border/foreground derived deterministically.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim()
  const hh = h.length === 3 ? h.split("").map(c => c + c).join("") : h
  const r = parseInt(hh.slice(0, 2), 16)
  const g = parseInt(hh.slice(2, 4), 16)
  const b = parseInt(hh.slice(4, 6), 16)
  return { r, g, b }
}

function rgbToHslTriplet(r8: number, g8: number, b8: number): string {
  const r = r8 / 255, g = g8 / 255, b = b8 / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  const d = max - min
  let s = 0

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
    if (h < 0) h += 360
  }

  const H = Math.round(h)
  const S = Math.round(s * 1000) / 10
  const L = Math.round(l * 1000) / 10
  return `${H} ${S}% ${L}%`
}

function hexToHslTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHslTriplet(r, g, b)
}

function relativeLuminance(hex: string): number {
  // sRGB luminance (0..1)
  const { r, g, b } = hexToRgb(hex)
  const srgb = [r, g, b].map(v => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function isDarkHex(hex: string): boolean {
  return relativeLuminance(hex) < 0.45
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a), B = hexToRgb(b)
  const tt = clamp01(t)
  const r = Math.round(A.r + (B.r - A.r) * tt)
  const g = Math.round(A.g + (B.g - A.g) * tt)
  const bb = Math.round(A.b + (B.b - A.b) * tt)
  return `#${[r, g, bb].map(x => x.toString(16).padStart(2, "0")).join("")}`.toUpperCase()
}

function pickForegroundFor(bgHex: string): string {
  // deterministic: near-white for dark bg, near-charcoal for light bg
  return isDarkHex(bgHex) ? "#F8FAFC" : "#0B1220"
}

function buildThemeFromOrderedHex(id: string, name: string, ordered: string[]): ThemeDef {
  const c = ordered.map(x => x.toUpperCase())
  const primary = c[0] ?? "#4C8CFF"
  const secondary = c[1] ?? mixHex(primary, "#FFFFFF", 0.25)

  // Candidate selection (preserve user order intent)
  const backgroundCandidate = (c.length >= 5 ? c[4] : (c[2] ?? "#0B1220"))
  const surfaceCandidate = (c.length >= 4 ? c[3] : (isDarkHex(backgroundCandidate) ? mixHex(backgroundCandidate, "#FFFFFF", 0.06) : mixHex(backgroundCandidate, "#000000", 0.04)))
  const hintForeground = (c.length >= 3 ? c[2] : pickForegroundFor(backgroundCandidate))
  const borderCandidate = (c.length >= 6 ? c[5] : (isDarkHex(backgroundCandidate) ? mixHex(surfaceCandidate, "#FFFFFF", 0.14) : mixHex(surfaceCandidate, "#000000", 0.12)))
  const destructive = (c.length >= 7 ? c[6] : "#EF4444")

  // Decide mode from candidate luminance
  const mode: ThemeMode = isDarkHex(backgroundCandidate) ? "dark" : "light"

  // --- HARDENING: Force background/surface into usable neutral ranges ---
  // Goal: avoid saturated full-screen backgrounds (like bright green).
  function toNeutral(hex: string, modeLocal: ThemeMode, strength: number): string {
    const neutralTarget = modeLocal === "dark" ? "#0B1220" : "#F8FAFC"
    return mixHex(hex, neutralTarget, clamp01(strength))
  }

  function neutralizeBg(hex: string, modeLocal: ThemeMode): string {
    // progressively push toward neutral until luminance is in a sane range
    // dark: 0.03..0.10, light: 0.86..0.98
    let h = hex
    for (let i = 0; i < 6; i++) {
      const lum = relativeLuminance(h)
      const ok = modeLocal === "dark" ? (lum >= 0.03 && lum <= 0.10) : (lum >= 0.86 && lum <= 0.98)
      if (ok) break
      h = toNeutral(h, modeLocal, 0.16)
    }
    // also reduce saturation via extra neutral blend (deterministic)
    h = toNeutral(h, modeLocal, 0.18)
    return h
  }

  const background = neutralizeBg(backgroundCandidate, mode)
  const surface = neutralizeBg(surfaceCandidate, mode)

  // Ensure surface contrasts slightly from background
  const surface2 = mode === "dark"
    ? mixHex(surface, "#FFFFFF", 0.06)
    : mixHex(surface, "#000000", 0.05)

  const border = mode === "dark"
    ? mixHex(surface2, "#FFFFFF", 0.10)
    : mixHex(surface2, "#000000", 0.10)

  const foreground = pickForegroundFor(background)
  const cardForeground = pickForegroundFor(surface2)
  const popoverForeground = cardForeground
  const primaryFg = pickForegroundFor(primary)

  const tokens: Record<string, string> = {
    "--background": hexToHslTriplet(background),
    "--foreground": hexToHslTriplet(foreground),

    "--card": hexToHslTriplet(surface2),
    "--card-foreground": hexToHslTriplet(cardForeground),

    "--popover": hexToHslTriplet(surface2),
    "--popover-foreground": hexToHslTriplet(popoverForeground),

    "--primary": hexToHslTriplet(primary),
    "--primary-foreground": hexToHslTriplet(primaryFg),

    "--secondary": hexToHslTriplet(secondary),
    "--secondary-foreground": hexToHslTriplet(pickForegroundFor(secondary)),

    "--muted": hexToHslTriplet(mode === "dark" ? mixHex(background, surface2, 0.55) : mixHex(background, surface2, 0.45)),
    "--muted-foreground": hexToHslTriplet(mode === "dark" ? mixHex(foreground, "#94A3B8", 0.55) : mixHex(foreground, "#334155", 0.55)),

    "--accent": hexToHslTriplet(secondary),
    "--accent-foreground": hexToHslTriplet(pickForegroundFor(secondary)),

    "--border": hexToHslTriplet(border),
    "--input": hexToHslTriplet(border),

    "--ring": hexToHslTriplet(primary),

// ---- NEW SEMANTIC TOKENS ----
"--success": hexToHslTriplet("#16A34A"),
"--success-foreground": hexToHslTriplet("#FFFFFF"),

"--warning": hexToHslTriplet("#F59E0B"),
"--warning-foreground": hexToHslTriplet("#111827"),

"--danger": hexToHslTriplet("#DC2626"),
"--danger-foreground": hexToHslTriplet("#FFFFFF"),

"--info": hexToHslTriplet("#2563EB"),
"--info-foreground": hexToHslTriplet("#FFFFFF"),

"--surface-2": hexToHslTriplet(mode === "dark" ? mixHex(surface2, "#FFFFFF", 0.04) : mixHex(surface2, "#000000", 0.03)),
"--surface-3": hexToHslTriplet(mode === "dark" ? mixHex(surface2, "#FFFFFF", 0.08) : mixHex(surface2, "#000000", 0.06)),

"--input-bg": hexToHslTriplet(mode === "dark" ? mixHex(surface2, "#FFFFFF", 0.02) : mixHex(surface2, "#000000", 0.02)),
"--input-border": hexToHslTriplet(border),

    "--destructive": hexToHslTriplet(destructive),
    "--destructive-foreground": hexToHslTriplet(pickForegroundFor(destructive)),
  }

  // Optional: if user provided a strong text hint with clearly better contrast, use it
  const hintLum = relativeLuminance(hintForeground)
  const bgLum = relativeLuminance(background)
  const hintContrast = Math.abs(hintLum - bgLum)
  const fgLum = relativeLuminance(foreground)
  const fgContrast = Math.abs(fgLum - bgLum)
  if (hintContrast > fgContrast + 0.15) {
    tokens["--foreground"] = hexToHslTriplet(hintForeground)
  }

  return { id, name, mode, tokens }
}



export function getThemeById(id: string): ThemeDef | undefined {
  return THEMES.find(t => t.id === id)
}

/**
 * Apply theme tokens globally (NOT wired yet).
 * This changes ONLY CSS variables; no routing/PWA/chunk impact.
 */
export function applyTheme(theme: ThemeDef): void {
  const root = document.documentElement
  // Keep a mode flag for any `.dark`-based rules you may have outside tokens.
  root.classList.toggle("dark", theme.mode === "dark")

  for (const [k, v] of Object.entries(theme.tokens)) {
    root.style.setProperty(k, v)
  }
}





export const THEMES: ThemeDef[] = [

  buildThemeFromOrderedHex(
    "ceilings-light",
    "Ceilings Unlimited — Light",
    ["#7CC242","#1F2937","#111827","#F3F4F6","#FAFAFA","#E5E7EB","#DC2626"]
  ),

  buildThemeFromOrderedHex(
    "ceilings-dark",
    "Ceilings Unlimited — Dark",
    ["#7CC242","#94A3B8","#F1F5F9","#1E293B","#0F172A","#334155","#EF4444"]
  ),

  buildThemeFromOrderedHex(
    "future-grid",
    "Future Grid",
    ["#3B82F6","#06B6D4","#E2E8F0","#111827","#0B1220","#1F2937","#F43F5E"]
  ),

  buildThemeFromOrderedHex(
    "ivory-corporate",
    "Ivory Corporate",
    ["#2563EB","#64748B","#111827","#FFFFFF","#F8FAFC","#E2E8F0","#DC2626"]
  ),

  buildThemeFromOrderedHex(
    "graphite-pro",
    "Graphite Pro",
    ["#D4AF37","#94A3B8","#F8FAFC","#1C1F26","#121417","#2A2F38","#EF4444"]
  )

];


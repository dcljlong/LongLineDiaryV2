export type UiDensity = "compact" | "standard";

const KEY = "lldv2-ui-density";

export function getStoredDensity(): UiDensity | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "compact" || v === "standard") return v;
    return null;
  } catch {
    return null;
  }
}

export function storeDensity(d: UiDensity) {
  try {
    localStorage.setItem(KEY, d);
  } catch {
    // ignore
  }
}

export function applyDensity(d: UiDensity) {
  // use data attribute so CSS can switch vars
  document.documentElement.setAttribute("data-density", d);
}

export function initDensity(defaultDensity: UiDensity = "compact") {
  const d = getStoredDensity() ?? defaultDensity;
  applyDensity(d);
  // ensure consistent persistence even if empty/invalid
  storeDensity(d);
}

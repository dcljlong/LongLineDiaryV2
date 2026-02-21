export const BRAND = {
  appName: "Long Line Diary",
  appShortName: "LLD",
  developerName: "Long Line Developer",
  // Use BASE_URL so GitHub Pages + local dev both work
  developerLogoPath: `${import.meta.env.BASE_URL}icons/ll-developer-logo.png`,
  // Keep dark enterprise look aligned with LLT
  theme: {
    bg: "slate-900",
    panel: "slate-800",
    border: "slate-700/50",
    accent: "amber-500",
  },
} as const;

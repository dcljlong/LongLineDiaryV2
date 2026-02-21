declare const __BRAND_APP_NAME__: string | undefined;
declare const __BRAND_SHORT_NAME__: string | undefined;
declare const __BRAND_DEVELOPER_NAME__: string | undefined;
declare const __BRAND_DESCRIPTION__: string | undefined;
declare const __BRAND_LOGO_FILE__: string | undefined;

const appName = __BRAND_APP_NAME__ ?? "Long Line Diary";
const shortName = __BRAND_SHORT_NAME__ ?? "LLD";
const developerName = __BRAND_DEVELOPER_NAME__ ?? "Long Line Developer";
const description = __BRAND_DESCRIPTION__ ?? "Construction Site Diary & Project Tracking";
const logoFile = __BRAND_LOGO_FILE__ ?? "icons/ll-developer-logo.png";

export const BRAND = {
  appName,
  shortName,
  developerName,
  description,

  // Use BASE_URL so GitHub Pages + local dev both work
  logoPath: `${import.meta.env.BASE_URL}${logoFile}`,

  theme: {
    bg: "slate-900",
    panel: "slate-800",
    border: "slate-700/50",
    accent: "amber-500",
  },
} as const;

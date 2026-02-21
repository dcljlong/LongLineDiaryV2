import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { BRAND_CONFIG } from "./brand.config";

export default defineConfig(() => ({
  base: BRAND_CONFIG.base,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [BRAND_CONFIG.logoFile],
      manifest: {
        name: BRAND_CONFIG.appName,
        short_name: BRAND_CONFIG.shortName,
        description: BRAND_CONFIG.description,
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: BRAND_CONFIG.base,
        scope: BRAND_CONFIG.base,
        icons: [
          {
            src: `${BRAND_CONFIG.base}${BRAND_CONFIG.logoFile}`,
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: `${BRAND_CONFIG.base}${BRAND_CONFIG.logoFile}`,
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: `${BRAND_CONFIG.base}${BRAND_CONFIG.logoFile}`,
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

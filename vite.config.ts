import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(() => ({
  base: "/LongLineDiaryV2/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["ll-developer-logo.png"],
      manifest: {
        name: "Long Line Diary",
        short_name: "LLD",
        description: "Construction Site Diary & Project Tracking",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/LongLineDiaryV2/",
        scope: "/LongLineDiaryV2/",
        icons: [
          { src: "ll-developer-logo.png", sizes: "192x192", type: "image/png" },
          { src: "ll-developer-logo.png", sizes: "512x512", type: "image/png" }
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

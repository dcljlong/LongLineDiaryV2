import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { BRAND_CONFIG } from "./brand.config";

export default defineConfig(() => ({
  base: BRAND_CONFIG.base,

  define: {
    __BRAND_APP_NAME__: JSON.stringify(BRAND_CONFIG.appName),
    __BRAND_SHORT_NAME__: JSON.stringify(BRAND_CONFIG.shortName),
    __BRAND_DEVELOPER_NAME__: JSON.stringify(BRAND_CONFIG.developerName),
    __BRAND_DESCRIPTION__: JSON.stringify(BRAND_CONFIG.description),
    __BRAND_LOGO_FILE__: JSON.stringify(BRAND_CONFIG.logoFile),
  },
server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id || !id.includes('node_modules')) return;

          // Keep large/clear vendor groups separate. Do NOT force React into its own chunk (can create cycles).
          if (id.includes('react-router')) return 'router';
          if (id.includes('@tanstack')) return 'tanstack';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('supabase')) return 'supabase';
          if (id.includes('lucide-react')) return 'icons';

          return 'vendor';
        },
      },
    },
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
          { src: "/LongLineDiaryV2/icons/lld-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/LongLineDiaryV2/icons/lld-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/LongLineDiaryV2/icons/lld-icon-512.png", sizes: "512x512", type: "image/png" },
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









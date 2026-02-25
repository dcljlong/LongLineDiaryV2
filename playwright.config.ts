import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/auth.setup.spec.ts"],
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:8080/LongLineDiaryV2/",
    headless: true,
    storageState: "playwright/.auth/user.json",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 8080",
    url: "http://127.0.0.1:8080/LongLineDiaryV2/",
    reuseExistingServer: true,
  },
});

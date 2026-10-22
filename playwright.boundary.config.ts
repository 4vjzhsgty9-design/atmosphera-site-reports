import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results-boundary",
  testMatch: "boundary.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:3101",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    env: {
      APP_MODE: "connected",
      SUPABASE_URL: "",
      SUPABASE_PUBLISHABLE_KEY: "",
      APP_ORIGIN: "http://127.0.0.1:3101",
    },
  },
});

import { defineConfig } from "@playwright/test";
import { loadEnvFile } from "node:process";
loadEnvFile(process.env.SUPABASE_TEST_ENV ?? ".env.test.local");
if (
  !["127.0.0.1", "localhost"].includes(
    new URL(process.env.SUPABASE_URL ?? "invalid").hostname,
  )
)
  throw new Error("Connected tests require a local test database.");
export default defineConfig({
  testDir: "./tests",
  testMatch: "connected.spec.ts",
  outputDir: "test-results-connected",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3102",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3102",
    url: "http://127.0.0.1:3102/login",
    reuseExistingServer: false,
    env: {
      APP_MODE: "connected",
      APP_ORIGIN: "http://127.0.0.1:3102",
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY!,
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY!,
    },
  },
});

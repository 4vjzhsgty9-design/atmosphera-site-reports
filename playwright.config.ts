import { defineConfig } from "@playwright/test";
const port = Number(process.env.E2E_PORT ?? 3100);
export default defineConfig({
  testDir: "./tests",
  testMatch: "app.spec.ts",
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: { APP_MODE: "demo" },
    timeout: 30000,
  },
});

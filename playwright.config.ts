import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "on",
    trace: "on-first-retry",
  },
  outputDir: "./tests/e2e/results",
  webServer: [
    {
      command: "npx tsx apps/api/src/server.ts",
      port: 8787,
      reuseExistingServer: true,
      timeout: 10000,
    },
    {
      command: "npx vite --config apps/web/vite.config.ts --root apps/web --port 5173",
      port: 5173,
      reuseExistingServer: true,
      timeout: 10000,
    },
  ],
});

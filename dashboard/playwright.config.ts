import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3200",
    headless: true,
  },
  webServer: {
    command: "pnpm dev -p 3200",
    url: "http://127.0.0.1:3200",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})


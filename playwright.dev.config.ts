import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig({
  ...config,
  testMatch: "**/hu-003-client-controls.spec.ts",
  retries: 0,
  outputDir: "test-results/dev-client",
  use: { ...config.use, baseURL: "http://127.0.0.1:3004" },
  webServer: {
    command: "npm run dev -- --port 3004",
    url: "http://127.0.0.1:3004",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { E2E_FIXTURES: "1" },
  },
});

import { defineConfig, devices } from "@playwright/test";

// Must match the base vite.config.ts derives from BASE_PATH.
const basePath = `/${(process.env.BASE_PATH ?? "").replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");
const previewUrl = `http://127.0.0.1:4173${basePath}`;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: previewUrl,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    reuseExistingServer: true,
    url: previewUrl,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1024 } } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
  ],
});

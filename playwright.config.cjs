const { defineConfig, devices } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:4173", reducedMotion: "reduce", trace: "retain-on-failure" },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-small-mobile", use: { ...devices["Pixel 7"], viewport: { width: 320, height: 740 } } },
    { name: "webkit-mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: { command: "node scripts/serve-build.mjs", url: "http://127.0.0.1:4173", reuseExistingServer: false },
});

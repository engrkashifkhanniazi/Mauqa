import { defineConfig, devices } from "@playwright/test";
const base = process.env.BASE_URL ?? "http://localhost:3000";
export default defineConfig({ testDir: "./tests/e2e", timeout: 30000, reporter: "list",
  use: { baseURL: base, ...(process.env.PW_SYSTEM_CHROME ? { channel: "chrome" as const } : {}) }, projects: [{ name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } }, { name: "desktop", use: { viewport: { width: 1440, height: 900 } } }],
  webServer: process.env.BASE_URL ? undefined : { command: "npm run build && npm start", url: base, reuseExistingServer: true, timeout: 180000 } });

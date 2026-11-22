import { defineConfig, devices } from "@playwright/test";
export default defineConfig({ testDir: "./tests/live", timeout: 45000, reporter: [["list"], ["json", { outputFile: "live-report.json" }]], retries: 1,
  use: { baseURL: process.env.BASE_URL ?? "https://rozgardesk.vercel.app", ...(process.env.PW_SYSTEM_CHROME ? { channel: "chrome" as const } : {}) },
  projects: [{ name: "mobile-390x844", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } }, { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } }] });

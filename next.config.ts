import type { NextConfig } from "next";
const config: NextConfig = { poweredByHeader: false, reactStrictMode: true, htmlLimitedBots: /.*/,
  async headers() { return [{ source: "/fonts/:file*", headers: [{ key: "cache-control", value: "public, max-age=31536000, immutable" }] }]; },
  // Old name (Rozgar Desk): send public pages on the old host to the new one. /api and /admin stay on both hosts so existing tools keep working.
  async redirects() { return [{ source: "/:path((?!api|admin).*)", has: [{ type: "host", value: "rozgardesk.vercel.app" }], destination: "https://mauqa.vercel.app/:path", permanent: true }]; } };
export default config;

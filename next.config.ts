import type { NextConfig } from "next";
const config: NextConfig = { poweredByHeader: false, reactStrictMode: true, htmlLimitedBots: /.*/,
  async headers() { return [{ source: "/fonts/:file*", headers: [{ key: "cache-control", value: "public, max-age=31536000, immutable" }] }]; } };
export default config;

import type { MetadataRoute } from "next";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rozgar-desk.vercel.app";
export default function robots(): MetadataRoute.Robots { return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] }], sitemap: `${SITE}/sitemap.xml` }; }

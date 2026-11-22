import type { MetadataRoute } from "next";
import { allSlugs } from "@/lib/jobs";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rozgardesk.vercel.app";
export const revalidate = 900;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await allSlugs().catch(() => []);
  return [{ url: SITE, changeFrequency: "hourly" as const }, { url: `${SITE}/privacy` }, ...s.map((x) => ({ url: `${SITE}/jobs/${x.slug}`, lastModified: x.updated }))];
}

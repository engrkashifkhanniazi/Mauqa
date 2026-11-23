import type { MetadataRoute } from "next";
import { allSlugs } from "@/lib/jobs";
import { SITE } from "@/lib/site";
export const revalidate = 900;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await allSlugs().catch(() => []);
  return [{ url: SITE, changeFrequency: "hourly" as const }, ...["about", "contact", "privacy", "terms", "disclaimer"].map((p) => ({ url: `${SITE}/${p}`, changeFrequency: "yearly" as const })), ...s.map((x) => ({ url: `${SITE}/jobs/${x.slug}`, lastModified: x.updated }))];
}

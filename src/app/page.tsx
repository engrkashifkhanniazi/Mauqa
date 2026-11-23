import type { Metadata } from "next";
import { getJobs } from "@/lib/jobs";
import Browser from "@/components/Browser";
import { SITE } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = { alternates: { canonical: SITE, languages: { en: SITE, ur: `${SITE}/ur` } } };

export default async function Home() {
  const { jobs, sample } = await getJobs();
  return <Browser jobs={jobs} sample={sample} lang="en" />;
}

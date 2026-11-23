import type { Metadata } from "next";
import { getJobs } from "@/lib/jobs";
import Browser from "@/components/Browser";
import { SITE } from "@/lib/site";

/** Urdu homepage. Its own URL, so the Urdu design is in the server HTML (no English-to-Urdu flash) and Google can index it. */
export const revalidate = 300;
export const metadata: Metadata = {
  title: "خیبر پختونخوا اور اسلام آباد کی سرکاری نوکریاں | موقع",
  description: "اخبارات، پبلک سروس کمیشن اور ٹیسٹنگ اداروں کی سرکاری نوکریاں ایک جگہ: آخری تاریخ، سکیل، درخواست کا طریقہ اور اصل اشتہار۔",
  alternates: { canonical: `${SITE}/ur`, languages: { en: SITE, ur: `${SITE}/ur` } },
};

export default async function HomeUr() {
  const { jobs, sample } = await getJobs();
  return <Browser jobs={jobs} sample={sample} lang="ur" />;
}

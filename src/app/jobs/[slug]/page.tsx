import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobBySlug } from "@/lib/jobs";
import { hasAdImage } from "@/lib/adImage";
import { isGov } from "@/lib/types";
import { hasDb } from "@/db";
export const revalidate = 600;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mauqa.vercel.app";
const fd = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
type P = { params: Promise<{ slug: string }> };
/** English and Urdu labels both render; CSS shows the one that matches the reader's chosen language (html[lang]). */
const L = ({ en, ur }: { en: string; ur: string }) => <><span className="t-en">{en}</span><span className="t-ur" lang="ur">{ur}</span></>;
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const j = await getJobBySlug((await params).slug); if (!j) return { title: "Job not found" };
  return { title: `${j.title}, ${j.department}`, description: `${j.title}${j.department ? " at " + j.department : ""}. ${j.vacancies ? j.vacancies + " vacancies. " : ""}Last date ${fd(j.lastDate) || "not stated"}. Source: ${j.source}. Confirm details on the official advertisement.`, alternates: { canonical: `${SITE}/jobs/${j.slug}` }, openGraph: { title: j.title, type: "article", url: `${SITE}/jobs/${j.slug}` }, robots: j.status === "sample" ? { index: false } : undefined };
}
export default async function JobPage({ params }: P) {
  const j = await getJobBySlug((await params).slug); if (!j) notFound();
  const pic = hasDb() ? await hasAdImage(j.slug).catch(() => false) : false;
  const paper = !isGov(j.source);
  const left = j.lastDate ? Math.round((new Date(j.lastDate + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime()) / 864e5) : null;
  const closed = j.status === "closed" || (left != null && left < 0);
  const ld = { "@context": "https://schema.org", "@type": "JobPosting", title: j.title, description: `${j.title} advertised by ${j.department} (${j.source}). See the official advertisement for full details.`,
    datePosted: j.postedDate, validThrough: j.lastDate || undefined, hiringOrganization: { "@type": "Organization", name: j.department || j.source },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: j.city, addressRegion: j.province, addressCountry: "PK" } }, url: `${SITE}/jobs/${j.slug}`, directApply: false, identifier: { "@type": "PropertyValue", name: j.source, value: j.slug } };
  const facts: [[string, string], string][] = [
    [["Last date", "آخری تاریخ"], fd(j.lastDate)], [["Pay scale", "سکیل"], j.bps ? `BPS-${j.bps}` : ""], [["Vacancies", "اسامیاں"], j.vacancies ? String(j.vacancies) : ""],
    [["Education", "تعلیم"], j.education], [["Age", "عمر"], j.age], [["Location", "جگہ"], [j.city, j.province].filter(Boolean).join(", ")], [["Source", "ذریعہ"], j.source]];
  return (<div className="jp">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    <header className="jp-top"><div className="u-wrap jp-nav"><a href="/" className="jp-logo"><L en="Mauqa" ur="موقع" /></a><a href="/" className="jp-back"><L en="← All jobs" ur="تمام نوکریاں ←" /></a></div></header>
    <main className="u-wrap jp-main">
      <article className="jp-card">
        <div className="jp-badges"><bdi dir="ltr" className="jp-src">{j.source}</bdi><span className="jp-unv">{j.verified ? <L en="Verified" ur="تصدیق شدہ" /> : <L en="Unverified" ur="غیر تصدیق شدہ" />}</span>
          {left != null && <span className={"jp-left" + (closed ? " x" : left <= 7 ? " hot" : "")}>{closed ? <L en="Closed" ur="بند ہو چکی" /> : <><L en="Days left: " ur="باقی دن: " /><bdi dir="ltr">{left}</bdi></>}</span>}</div>
        <h1 dir="ltr">{j.title}</h1>
        {j.department && <p className="jp-dept" dir="ltr">{j.department}</p>}
        <dl className="jp-facts">{facts.filter(([, v]) => v).map(([[en, ur], v]) => <div key={en}><dt><L en={en} ur={ur} /></dt><dd><bdi dir="ltr">{v}</bdi></dd></div>)}</dl>
        {pic ? (<section className="jp-ad"><h2><L en="Advertisement" ur="اشتہار" /></h2>
          <a href={`/api/ad/${j.slug}`} target="_blank" rel="noopener noreferrer"><img src={`/api/ad/${j.slug}`} alt={`Advertisement: ${j.title}`} loading="lazy" /></a>
          <a className="jp-btn" href={`/api/ad/${j.slug}`} target="_blank" rel="noopener noreferrer"><L en="Open advertisement" ur="اشتہار کھولیں" /></a></section>)
          : paper ? <p className="jp-note"><L en="The ad picture for this newspaper listing is not added yet." ur="اس اخباری اشتہار کی تصویر ابھی شامل نہیں کی گئی۔" /></p>
          : <a className="jp-btn" href={j.officialUrl} target="_blank" rel="noopener noreferrer"><L en="Open official advertisement" ur="اصل اشتہار کھولیں" /></a>}
        <p className="jp-note"><L en="Not yet verified against the official source. Confirm every detail in the original advertisement before applying." ur="یہ معلومات ابھی تصدیق شدہ نہیں۔ درخواست دینے سے پہلے اصل اشتہار ضرور دیکھیں۔" /></p>
        <p className="jp-note"><L en="Mauqa lists facts and links to official sources. It does not accept applications and is not affiliated with any department." ur="موقع صرف معلومات اور اصل ذریعے کا لنک دیتا ہے، درخواستیں قبول نہیں کرتا اور کسی محکمے سے وابستہ نہیں۔" /></p>
      </article>
    </main></div>);
}

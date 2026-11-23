import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobBySlug, relatedJobs } from "@/lib/jobs";
import { hasAdImage } from "@/lib/adImage";
import { isGov } from "@/lib/types";
import { hasDb } from "@/db";
import { SITE, AD_SLOTS } from "@/lib/site";
import { howTo } from "@/lib/howto";
import ShareBar from "@/components/ShareBar";
import SaveJob from "@/components/SaveJob";
import AdSlot from "@/components/AdSlot";
import Follow from "@/components/Follow";
import InstallApp from "@/components/InstallApp";
import FootLinks from "@/components/FootLinks";
export const revalidate = 600;
const fd = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
type P = { params: Promise<{ slug: string }> };
/** English and Urdu labels both render; CSS shows the one that matches the reader's chosen language (html[lang]). */
const L = ({ en, ur }: { en: string; ur: string }) => <><span className="t-en">{en}</span><span className="t-ur" lang="ur">{ur}</span></>;
const daysLeft = (d: string) => d ? Math.round((new Date(d + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime()) / 864e5) : null;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const j = await getJobBySlug((await params).slug); if (!j) return { title: "Job not found" };
  const left = daysLeft(j.lastDate); const closed = j.status === "closed" || (left != null && left < 0);
  const desc = `${j.title}${j.department ? " at " + j.department : ""}${j.city ? ", " + j.city : ""}. ${j.vacancies ? j.vacancies + " posts. " : ""}${j.bps ? "BPS-" + j.bps + ". " : ""}Last date ${fd(j.lastDate) || "not stated"}. How to apply, required documents and the official advertisement.`;
  return { title: `${j.title}${j.department ? ", " + j.department : ""}`, description: desc, alternates: { canonical: `${SITE}/jobs/${j.slug}` },
    robots: closed ? { index: false, follow: true } : undefined,
    openGraph: { title: j.title, description: desc, type: "article", url: `${SITE}/jobs/${j.slug}`, siteName: "Mauqa" }, twitter: { card: "summary_large_image", title: j.title, description: desc } };
}

export default async function JobPage({ params }: P) {
  const j = await getJobBySlug((await params).slug); if (!j) notFound();
  const pic = hasDb() ? await hasAdImage(j.slug).catch(() => false) : false;
  const related = await relatedJobs(j).catch(() => []);
  const paper = !isGov(j.source);
  const left = daysLeft(j.lastDate);
  const closed = j.status === "closed" || (left != null && left < 0);
  // Long-closed jobs: the page goes away (404) after 90 days; the data stays in the database.
  if (closed && left != null && left < -90) notFound();
  const h = howTo(j.source);
  const url = `${SITE}/jobs/${j.slug}`;
  const facts: [[string, string], string][] = [
    [["Last date", "آخری تاریخ"], fd(j.lastDate)], [["Pay scale", "سکیل"], j.bps ? `BPS-${j.bps}` : ""], [["Vacancies", "اسامیاں"], j.vacancies ? String(j.vacancies) : ""],
    [["Education", "تعلیم"], j.education], [["Age", "عمر"], j.age], [["Location", "جگہ"], [j.city, j.province].filter(Boolean).join(", ")], [["Source", "ذریعہ"], j.source]];
  const description = `<p>${j.title}${j.department ? `, ${j.department}` : ""}${j.city ? `, ${j.city}` : ""}.</p><ul>${facts.filter(([, v]) => v).map(([[k], v]) => `<li>${k}: ${v}</li>`).join("")}</ul>`
    + `<p>How to apply: ${(j.applyHow ?? h.mode.en).replace(/[<>&]/g, "")}</p><p>Documents: ${h.docs.en}</p><p>Confirm every detail in the official advertisement (${j.source}).</p>`;
  const ld = closed ? null : { "@context": "https://schema.org", "@type": "JobPosting", title: j.title, description,
    datePosted: j.postedDate || j.added, validThrough: j.lastDate ? `${j.lastDate}T23:59:59+05:00` : undefined, employmentType: "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: j.department || j.source },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: j.city || undefined, addressRegion: j.province || undefined, addressCountry: "PK" } },
    educationRequirements: j.education || undefined, totalJobOpenings: j.vacancies || undefined, url, directApply: false, identifier: { "@type": "PropertyValue", name: j.source, value: j.slug } };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Jobs", item: SITE }, { "@type": "ListItem", position: 2, name: j.title, item: url }] };
  return (<div className="jp">
    {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, "\\u003c") }} />
    <header className="jp-top"><div className="u-wrap jp-nav"><a href="/" className="jp-logo"><L en="Mauqa" ur="موقع" /></a><div className="jp-nr"><InstallApp className="inst-d" /><a href="/" className="jp-back"><L en="← All jobs" ur="تمام نوکریاں ←" /></a></div></div></header>
    <main className="u-wrap jp-main">
      <nav className="jp-crumb" aria-label="Breadcrumb"><a href="/"><L en="Jobs" ur="نوکریاں" /></a><span aria-hidden="true">/</span><bdi dir="ltr">{j.source}</bdi></nav>
      <article className="jp-card">
        <div className="jp-badges"><bdi dir="ltr" className="jp-src">{j.source}</bdi><span className="jp-unv">{j.verified ? <L en="Verified" ur="تصدیق شدہ" /> : <L en="Unverified" ur="غیر تصدیق شدہ" />}</span>
          {left != null && <span className={"jp-left" + (closed ? " x" : left <= 7 ? " hot" : "")}>{closed ? <L en="Closed" ur="بند ہو چکی" /> : <><L en="Days left: " ur="باقی دن: " /><bdi dir="ltr">{left}</bdi></>}</span>}</div>
        {closed && <p className="jp-closed"><L en="This job is closed: the last date has passed. See similar open jobs below." ur="یہ نوکری بند ہو چکی ہے، آخری تاریخ گزر گئی۔ نیچے ملتی جلتی کھلی نوکریاں دیکھیں۔" /></p>}
        <h1 dir="ltr">{j.title}</h1>
        {j.department && <p className="jp-dept" dir="ltr">{j.department}</p>}
        <dl className="jp-facts">{facts.filter(([, v]) => v).map(([[en, ur], v]) => <div key={en}><dt><L en={en} ur={ur} /></dt><dd><bdi dir="ltr">{v}</bdi></dd></div>)}</dl>
        <div className="jp-acts"><SaveJob id={j.id} />{!closed && <ShareBar url={url} title={j.title} dept={j.department} last={fd(j.lastDate)} />}</div>
      </article>

      <section className="jp-card">
        {pic ? (<div className="jp-ad"><h2><L en="Advertisement" ur="اشتہار" /></h2>
          <a href={`/api/ad/${j.slug}`} target="_blank" rel="noopener noreferrer"><img src={`/api/ad/${j.slug}`} alt={`Newspaper advertisement: ${j.title}${j.department ? ", " + j.department : ""}`} loading="lazy" /></a>
          <a className="jp-btn" href={`/api/ad/${j.slug}`} target="_blank" rel="noopener noreferrer"><L en="Open advertisement" ur="اشتہار کھولیں" /></a></div>)
          : paper ? <p className="jp-note"><L en="The ad picture for this newspaper listing is not added yet." ur="اس اخباری اشتہار کی تصویر ابھی شامل نہیں کی گئی۔" /></p>
          : <a className="jp-btn" href={j.officialUrl} target="_blank" rel="noopener noreferrer"><L en="Open official advertisement" ur="اصل اشتہار کھولیں" /></a>}
        <p className="jp-note"><L en="Not yet verified against the official source. Confirm every detail in the original advertisement before applying." ur="یہ معلومات ابھی تصدیق شدہ نہیں۔ درخواست دینے سے پہلے اصل اشتہار ضرور دیکھیں۔" /></p>
      </section>

      <section className="jp-card jp-how">
        <h2><L en="How to apply" ur="درخواست کیسے دیں" /></h2>
        {j.applyHow ? <div className="jp-from"><b><L en="From the advertisement" ur="اشتہار کے مطابق" /></b><p dir="auto">{j.applyHow}</p></div>
          : <p className="jp-gen"><b><L en="General guidance" ur="عمومی رہنمائی" /></b><span><L en={h.mode.en} ur={h.mode.ur} /></span></p>}
        <dl className="jp-short"><div><dt><L en="Documents" ur="کاغذات" /></dt><dd><L en={h.docs.en} ur={h.docs.ur} /></dd></div>
          <div><dt><L en="Remember" ur="یاد رکھیں" /></dt><dd><L en={h.remember.en} ur={h.remember.ur} /></dd></div></dl>
        <p className="jp-note"><L en="If the advertisement says anything different, follow the advertisement." ur="اشتہار میں کچھ اور لکھا ہو تو اشتہار کی بات مانیں۔" /></p>
      </section>

      {!closed && <AdSlot slot={AD_SLOTS.jobMid} kind="rect" />}

      <Follow />

      {related.length > 0 && <section className="jp-card jp-rel"><h2><L en="Similar jobs" ur="ملتی جلتی نوکریاں" /></h2>
        <ul>{related.map((r) => { const l = daysLeft(r.lastDate); return (<li key={r.id}><a href={`/jobs/${r.slug}`}><b dir="ltr">{r.title}</b><span dir="ltr">{[r.department, r.city].filter(Boolean).join(" · ")}</span>
          {l != null && <em className={l <= 7 ? "hot" : ""}><L en={`${l} days left`} ur={`${l} دن باقی`} /></em>}</a></li>); })}</ul>
        <a className="jp-more" href="/"><L en="See all jobs" ur="تمام نوکریاں دیکھیں" /></a></section>}

      <p className="jp-note jp-disc"><L en="Mauqa lists facts and links to official sources. It does not accept applications and is not affiliated with any department." ur="موقع صرف معلومات اور اصل ذریعے کا لنک دیتا ہے، درخواستیں قبول نہیں کرتا اور کسی محکمے سے وابستہ نہیں۔" /></p>
      {!closed && <AdSlot slot={AD_SLOTS.jobEnd} kind="rect" />}
    </main>
    <footer className="u-foot"><div className="u-wrap"><FootLinks /></div></footer></div>);
}

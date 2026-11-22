import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobBySlug } from "@/lib/jobs";
export const revalidate = 600;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rozgardesk.vercel.app";
const fd = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not stated";
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const j = await getJobBySlug((await params).slug); if (!j) return { title: "Job not found" };
  return { title: `${j.title}, ${j.department}`, description: `${j.title} at ${j.department}. ${j.vacancies ?? ""} vacancies. Last date ${fd(j.lastDate)}. Source: ${j.source}.`, alternates: { canonical: `${SITE}/jobs/${j.slug}` }, openGraph: { title: j.title, type: "article", url: `${SITE}/jobs/${j.slug}` }, robots: j.status === "sample" ? { index: false } : undefined };
}
export default async function JobPage({ params }: P) {
  const j = await getJobBySlug((await params).slug); if (!j) notFound();
  const closed = j.status === "closed" || (j.lastDate && new Date(j.lastDate + "T23:59:59") < new Date());
  // JSON-LD mirrors visible content only; omitted fields are omitted, never invented.
  const ld = { "@context": "https://schema.org", "@type": "JobPosting", title: j.title, description: `${j.title} advertised by ${j.department} (${j.source}). See the official advertisement for full details.`,
    datePosted: j.postedDate, validThrough: j.lastDate || undefined, hiringOrganization: { "@type": "Organization", name: j.department || j.source },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: j.city, addressRegion: j.province, addressCountry: "PK" } }, url: `${SITE}/jobs/${j.slug}`, directApply: false, identifier: { "@type": "PropertyValue", name: j.source, value: j.slug } };
  return (<main className="wrap" style={{ padding: "28px 20px 60px", maxWidth: 820 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    <p><a href="/">← All jobs</a></p>
    {closed && <p role="status" className="due hot" style={{ display: "inline-block", margin: "10px 0" }}>Closed. This advertisement is past its last date.</p>}
    <h1 style={{ fontSize: 34, margin: "8px 0" }}>{j.title}</h1><p className="org">{j.department} · {j.source}</p>
    <div className="fc" style={{ margin: "20px 0" }}>{[["Last date", fd(j.lastDate)], ["Pay scale", j.bps ? `BPS-${j.bps}` : "Not stated"], ["Vacancies", j.vacancies ? String(j.vacancies) : "Not stated"], ["Education", j.education || "See advertisement"], ["Age", j.age || "See advertisement"], ["Location", [j.city, j.province].filter(Boolean).join(", ") || "See advertisement"]].map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}</div>
    {j.verified ? <div className="vf"><b>Verified:</b> fields were confirmed against the official source.</div> : <p className="nt">Not yet verified against the official source. Confirm every detail in the original advertisement.</p>}
    <p style={{ margin: "20px 0" }}><a className="cta" style={{ display: "inline-grid", placeItems: "center", padding: "0 22px", textDecoration: "none" }} href={j.officialUrl} rel="noopener noreferrer" target="_blank">Open official advertisement</a></p>
    {j.files.length > 0 && <ul>{j.files.map((f) => <li key={f.url}><a href={f.url} rel="noopener noreferrer">{f.label}</a> ({f.kind})</li>)}</ul>}
    <p className="nt">Disclaimer: Rozgar Desk lists structured facts and links to official sources. It does not accept applications and is not affiliated with any commission or department.</p>
  </main>);
}

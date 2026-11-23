import { ImageResponse } from "next/og";
import { getJobBySlug } from "@/lib/jobs";
import { SITE_HOST } from "@/lib/site";
export const alt = "Job details on Mauqa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;
const fd = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
/** The picture WhatsApp/Facebook show when a job link is shared. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const j = await getJobBySlug((await params).slug).catch(() => null);
  const title = j?.title ?? "Government jobs in Pakistan";
  const chips = j ? [j.lastDate && `Last date: ${fd(j.lastDate)}`, j.bps && `BPS-${j.bps}`, j.vacancies && `${j.vacancies} posts`, j.city].filter(Boolean) as string[] : [];
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", background: "linear-gradient(135deg,#0A2620 0%,#0E6B4D 100%)", color: "#fff", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#2FC79A", color: "#04251C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800 }}>M</div>
        <div style={{ fontSize: 40, fontWeight: 800 }}>Mauqa</div>
        {j && <div style={{ marginLeft: "auto", fontSize: 26, padding: "8px 20px", borderRadius: 999, background: "rgba(255,255,255,.14)" }}>{j.source}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: title.length > 60 ? 52 : 64, fontWeight: 800, lineHeight: 1.1 }}>{title.slice(0, 110)}</div>
        {j?.department && <div style={{ fontSize: 32, color: "#BFE6D6" }}>{j.department.slice(0, 90)}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {chips.map((c, i) => <div key={c} style={{ fontSize: 28, fontWeight: 700, padding: "10px 22px", borderRadius: 14, background: i === 0 ? "#F2C14E" : "rgba(255,255,255,.14)", color: i === 0 ? "#1A1500" : "#fff" }}>{c}</div>)}
        <div style={{ marginLeft: "auto", fontSize: 26, color: "#BFE6D6" }}>{SITE_HOST}</div>
      </div>
    </div>, size);
}

import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
import AdImageInput from "@/components/AdImageInput";
export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";
type R = Record<string, unknown>;
const rows = async (q: ReturnType<typeof sql>) => { const r = await db().execute(q); return (r.rows ?? r) as R[]; };
const SOURCES = ["Daily Ausaf", "Nawa-i-Waqt", "Daily Express", "Daily Aaj", "Daily Mashriq", "Daily Jang", "ETEA", "FPSC", "KPPSC", "NTS", "OTS", "PTS", "ATS", "NJP"];
/** Sources the GitHub robots read by themselves; the rest are added from this page. */
const AUTO = new Set(["FPSC", "KPPSC", "NTS", "ATS", "Daily Mashriq", "Daily Jang", "Daily Express", "Daily Aaj"]);
const I = ({ d }: { d: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const NAV: [string, string, string][] = [["#top", "Overview", "M3 11l9-7 9 7v9H3z"], ["#add", "Add job", "M12 5v14M5 12h14"], ["#paste", "Paste many", "M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"], ["#review", "Review queue", "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"], ["#health", "Sources", "M3 12h4l3-7 4 14 3-7h4"], ["#tools", "Tools", "M14 7l3 3-8 8H6v-3z"]];

export default async function Admin() {
  if (!isAdmin((await cookies()).get("rd_admin")?.value)) return (
    <main className="a1" dir="ltr" lang="en" style={{ alignItems: "center", justifyContent: "center" }}><form method="post" action="/api/admin/login" className="a1-card" style={{ width: "min(400px,92vw)" }}>
      <h1 style={{ fontSize: 24 }}>Rozgar Desk admin</h1>
      <label htmlFor="pw">Password<input id="pw" name="password" type="password" required autoComplete="current-password" /></label>
      <button className="a1-btn" type="submit">Sign in</button></form></main>);
  if (!hasDb()) return <main className="a1" dir="ltr" lang="en"><div className="a1-main"><h1>Admin</h1><p>DATABASE_URL is not set.</p></div></main>;
  const [health, queue, spend, kpi] = await Promise.all([
    rows(sql`select s.key, s.last_status, s.last_checked_at, (select items_seen from ingest_runs r where r.source_id = s.id order by r.id desc limit 1) as last_seen from sources s order by s.key`),
    rows(sql`select q.id, q.reason, j.title, j.official_url from review_queue q join jobs j on j.id = q.job_id where q.resolved_at is null order by q.id limit 100`),
    rows(sql`select coalesce(sum(cost_usd),0)::float as usd, count(*)::int as calls from ai_calls where created_at >= date_trunc('month', now())`),
    rows(sql`select (select count(*)::int from jobs where status='published' and (last_date is null or last_date >= current_date)) as live,
      (select count(*)::int from jobs where created_at >= current_date) as today,
      (select count(*)::int from jobs where status='published' and last_date between current_date and current_date + 3) as closing`)]);
  const cap = Number(process.env.CLAUDE_MONTHLY_BUDGET_USD || 8); const usd = Number(spend[0]?.usd ?? 0);
  const k = kpi[0] ?? {};
  const hmap = new Map(health.map((h) => [String(h.key), h]));
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Karachi" });
  return (<div className="a1" dir="ltr" lang="en">
    <nav className="a1-side" aria-label="Admin">
      <a className="a1-brand" href="/"><span>R</span>Rozgar Desk</a>
      {NAV.map(([h, l, d]) => <a key={h} className="l" href={h}><I d={d} />{l}</a>)}
      <div className="a1-spend">AI spend this month<div className="a1-meter"><i style={{ width: `${Math.min(100, (usd / cap) * 100)}%` }} /></div>${usd.toFixed(2)} of ${cap} cap · {String(spend[0]?.calls ?? 0)} calls</div>
    </nav>
    <main className="a1-main" id="top">
      <header className="a1-head"><div><p>{today}</p><h1>Good morning, Kashif</h1></div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><a className="a1-btn o" href="/">View site</a><a className="a1-btn" href="#add">+ New job</a></div></header>
      <div className="a1-kpi">{[["Live jobs", k.live], ["Added today", k.today], ["Closing in 3 days", k.closing], ["Waiting review", queue.length]].map(([l, v]) => <div key={String(l)}><span>{String(l)}</span><b>{String(v ?? 0)}</b></div>)}</div>
      <div className="a1-row">
        <section className="a1-card" id="add"><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h2>Add a job by hand</h2><span className="nt">Posts as Unverified · the rules engine checks it</span></div>
          <form method="post" action="/api/admin/add" encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label htmlFor="add-source">Source<select id="add-source" name="source" defaultValue="Daily Ausaf">{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <div className="a1-grid">{([["title", "Post title", "text", true], ["department", "Department", "text", false], ["city", "City", "text", false], ["bps", "BPS (1-22)", "number", false], ["vacancies", "Vacancies", "number", false], ["education", "Education", "text", false], ["lastDate", "Last date", "date", true], ["officialUrl", "Official ad link", "url", true], ["applyUrl", "Apply link (optional)", "url", false]] as const).map(([n, l, t, req]) =>
              <label key={n} htmlFor={"add-" + n}>{l}{req ? " *" : ""}<input id={"add-" + n} name={n} type={t} required={req} /></label>)}</div>
            <AdImageInput />
            <button className="a1-btn" type="submit">Publish</button></form></section>
        <aside className="a1-card" id="health"><h2>Sources</h2><div>{SOURCES.map((s) => { const h = hmap.get(s); const st = String(h?.last_status ?? "");
          return <div className="a1-src" key={s}><span><i className={st === "ok" ? "ok" : /err|fail|refus/i.test(st) ? "err" : ""} />{s}</span><small>{AUTO.has(s) ? "Automatic" : "Manual"}{h?.last_checked_at ? ` · ${new Date(String(h.last_checked_at)).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}</small></div>; })}</div></aside>
      </div>
      <section className="a1-card" id="paste"><h2>Paste many jobs at once</h2><p className="nt">One job per line: title;;department;;city;;vacancies;;bps;;education;;YYYY-MM-DD. You check the list before it goes live.</p>
        <form method="post" action="/api/admin/paste" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="a1-grid"><label htmlFor="p-source">Source<select id="p-source" name="source" defaultValue="ETEA">{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label htmlFor="p-url">Official page link *<input id="p-url" name="officialUrl" type="url" required /></label></div>
          <label htmlFor="p-text">Lines *<textarea id="p-text" name="text" required rows={7} /></label>
          <button className="a1-btn" type="submit">Preview</button></form></section>
      <section className="a1-card" id="review"><h2>Review queue ({queue.length})</h2>{queue.length === 0 && <p className="nt">Nothing to review.</p>}
        {queue.map((q) => <form key={String(q.id)} method="post" action="/api/admin/resolve" className="a1-q"><b>{String(q.title)}</b><span className="nt">{String(q.reason)} · <a href={String(q.official_url)} rel="noopener noreferrer" target="_blank">official source</a></span><input type="hidden" name="id" value={String(q.id)} />
          <div style={{ display: "flex", gap: 8 }}><button className="a1-btn" name="action" value="publish" type="submit">Publish</button><button className="a1-btn r" name="action" value="reject" type="submit">Reject</button></div></form>)}</section>
      <section className="a1-card" id="tools"><h2>Keep to Khyber Pakhtunkhwa and Islamabad</h2><p className="nt">Hides live listings that name another province. Nothing is deleted.</p>
        <form method="post" action="/api/admin/scope-clean"><button className="a1-btn o" type="submit">Hide other-province listings</button></form>
        <h2>Remove duplicate listings</h2><p className="nt">Same post, same source and last date listed twice: keeps one, hides the rest.</p>
        <form method="post" action="/api/admin/dedupe"><button className="a1-btn o" type="submit">Hide duplicates</button></form></section>
    </main></div>);
}

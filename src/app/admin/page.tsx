import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";
type R = Record<string, unknown>;
const rows = async (q: ReturnType<typeof sql>) => { const r = await db().execute(q); return (r.rows ?? r) as R[]; };
export default async function Admin() {
  if (!isAdmin((await cookies()).get("rd_admin")?.value)) return (<main className="wrap" style={{ padding: "40px 20px", maxWidth: 420 }}><h1>Admin</h1>
    <form method="post" action="/api/admin/login"><label htmlFor="pw">Password</label><input id="pw" name="password" type="password" required style={{ display: "block", width: "100%", minHeight: 44, margin: "8px 0 14px", padding: "0 12px" }} /><button className="cta" type="submit">Sign in</button></form></main>);
  if (!hasDb()) return <main className="wrap" style={{ padding: 40 }}><h1>Admin</h1><p>DATABASE_URL is not set.</p></main>;
  const [health, queue, spend] = await Promise.all([
    rows(sql`select s.key, s.last_status, s.last_checked_at, (select items_seen from ingest_runs r where r.source_id = s.id order by r.id desc limit 1) as last_seen from sources s order by s.key`),
    rows(sql`select q.id, q.reason, j.title, j.official_url from review_queue q join jobs j on j.id = q.job_id where q.resolved_at is null order by q.id limit 100`),
    rows(sql`select coalesce(sum(cost_usd),0)::float as usd, count(*)::int as calls from ai_calls where created_at >= date_trunc('month', now())`)]);
  return (<main className="wrap" style={{ padding: "28px 20px 60px" }}><h1>Admin</h1>
    <h2>Source health</h2><ul>{health.map((h) => <li key={String(h.key)}><b>{String(h.key)}</b>: {String(h.last_status ?? "never run")}, last items {String(h.last_seen ?? "-")}, checked {h.last_checked_at ? new Date(String(h.last_checked_at)).toISOString() : "never"}</li>)}</ul>
    <h2>AI spend this month</h2><p>${Number(spend[0]?.usd ?? 0).toFixed(4)} of ${process.env.CLAUDE_MONTHLY_BUDGET_USD ?? "unset"} cap, {String(spend[0]?.calls ?? 0)} calls</p>
    <h2>Review queue ({queue.length})</h2>{queue.length === 0 && <p>Nothing to review.</p>}
    {queue.map((q) => <form key={String(q.id)} method="post" action="/api/admin/resolve" className="card" style={{ padding: 14, margin: "10px 0" }}><b>{String(q.title)}</b><p className="nt">{String(q.reason)} · <a href={String(q.official_url)} rel="noopener noreferrer">official source</a></p><input type="hidden" name="id" value={String(q.id)} />
      <button className="rs" name="action" value="publish" type="submit">Publish</button> <button className="rs" name="action" value="reject" type="submit">Reject</button></form>)}</main>);
}

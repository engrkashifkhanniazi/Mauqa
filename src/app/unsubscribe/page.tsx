import { sql } from "drizzle-orm";
import { db, hasDb } from "@/db";
export const metadata = { title: "Unsubscribe", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Unsub({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams; let ok = false;
  if (token && hasDb()) { const r = await db().execute(sql`update alerts set unsubscribed_at = now() where token = ${token} returning id`); ok = ((r.rows ?? r) as unknown[]).length > 0; }
  return <main className="wrap" style={{ padding: "40px 20px" }}><h1>{ok ? "You are unsubscribed" : "Link invalid"}</h1><p><a href="/">Back to jobs</a></p></main>;
}

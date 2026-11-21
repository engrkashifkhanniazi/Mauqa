import { sql } from "drizzle-orm";
import { db, hasDb } from "@/db";
export const metadata = { title: "Confirm alert", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams; let ok = false;
  if (token && hasDb()) { const r = await db().execute(sql`update alerts set confirmed_at = now() where token = ${token} and unsubscribed_at is null returning id`); ok = ((r.rows ?? r) as unknown[]).length > 0; }
  return <main className="wrap" style={{ padding: "40px 20px" }}><h1>{ok ? "Alert confirmed" : "Link invalid or expired"}</h1><p><a href="/">Back to jobs</a></p></main>;
}

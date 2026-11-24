import { refreshSite } from "@/lib/refresh";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
/** Reopens a closed job with a new (extended) last date, e.g. when the department extends the deadline. */
export async function POST(req: NextRequest) {
  if (!isAdmin(req.cookies.get("rd_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const f = await req.formData(); const id = Number(f.get("id")); const d = String(f.get("lastDate") ?? "");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  if (!Number.isInteger(id) || !/^\d{4}-\d{2}-\d{2}$/.test(d) || d < today) return NextResponse.json({ error: "Pick a new last date from today onwards." }, { status: 400 });
  await db().execute(sql`update jobs set status = 'published', last_date = ${d}, updated_at = now() where id = ${id} and status = 'closed'`);
  refreshSite();
  return NextResponse.redirect(new URL("/admin?reopened=1#closed", req.url), 303);
}

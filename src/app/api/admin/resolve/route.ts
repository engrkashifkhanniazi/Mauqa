import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
export async function POST(req: NextRequest) {
  if (!isAdmin(req.cookies.get("rd_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const f = await req.formData(); const id = Number(f.get("id")); const action = String(f.get("action"));
  if (!Number.isInteger(id) || !["publish", "reject"].includes(action)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  // Manual publish never sets verified_at: only code-confirmed fields may be "Verified".
  await db().execute(sql`update jobs set status = ${action === "publish" ? "published" : "rejected"}, updated_at = now() where id = (select job_id from review_queue where id = ${id})`);
  await db().execute(sql`update review_queue set resolved_by = 'admin', resolved_at = now() where id = ${id}`);
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}

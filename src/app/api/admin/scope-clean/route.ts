import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
import { checkScope } from "@/pipeline/scope";
const rows = (r: unknown) => ((r as { rows?: unknown[] }).rows ?? r) as Record<string, unknown>[];
/** Hides (status = rejected) every published job outside Khyber Pakhtunkhwa / Islamabad, using the same deterministic check as the publish gate. Nothing is deleted. */
export async function POST(req: NextRequest) {
  if (!isAdmin(req.cookies.get("rd_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const list = rows(await db().execute(sql`select id, title, department, city from jobs where status = 'published'`));
  const hide = list.filter((j) => !checkScope(String(j.title ?? ""), String(j.department ?? ""), String(j.city ?? "")).inScope).map((j) => Number(j.id));
  for (const id of hide) await db().execute(sql`update jobs set status = 'rejected', updated_at = now() where id = ${id}`);
  return new NextResponse(`<!doctype html><meta charset="utf-8"><title>Scope clean</title><body style="font-family:sans-serif;max-width:600px;margin:40px auto"><h2>Done</h2><p>${hide.length} listing(s) outside Khyber Pakhtunkhwa and Islamabad were hidden (not deleted).</p><p><a href="/admin">Admin</a></p>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}

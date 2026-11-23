import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
const rows = (r: unknown) => ((r as { rows?: unknown[] }).rows ?? r) as Record<string, unknown>[];
/** Same post listed twice (e.g. "DC Dir Upper" and "DC Dir Upper - 2026", same source and last date): keeps the oldest, hides the rest. Nothing is deleted. */
const normTitle = (t: string) => t.toLowerCase().replace(/\s*[-–]\s*20\d\d\s*$/, "").replace(/[^a-z0-9]+/g, " ").trim();
export async function POST(req: NextRequest) {
  if (!isAdmin(req.cookies.get("rd_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const list = rows(await db().execute(sql`select id, source_id, title, department, last_date, bps, vacancies from jobs where status = 'published' order by id`));
  // group by source + title + last date; inside a group keep one row per department, and drop blank-department rows when a filled one exists
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const j of list) { const k = [j.source_id, normTitle(String(j.title)), String(j.last_date ?? "").slice(0, 10)].join("|"); groups.set(k, [...(groups.get(k) ?? []), j]); }
  const hide: number[] = [];
  for (const g of groups.values()) {
    const filled = g.filter((j) => String(j.department ?? "").trim());
    const keepDept = new Set<string>();
    for (const j of g) {
      const d = normTitle(String(j.department ?? ""));
      if (!d && filled.length && j.bps == null && j.vacancies == null) { hide.push(Number(j.id)); continue; }
      if (keepDept.has(d)) { hide.push(Number(j.id)); continue; }
      keepDept.add(d);
    }
  }
  for (const id of hide) await db().execute(sql`update jobs set status = 'rejected', updated_at = now() where id = ${id}`);
  return new NextResponse(`<!doctype html><meta charset="utf-8"><title>Duplicates</title><body style="font-family:sans-serif;max-width:600px;margin:40px auto"><h2>Done</h2><p>${hide.length} duplicate listing(s) hidden (not deleted).</p><p><a href="/admin">Admin</a></p>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}

import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
import { evaluate } from "@/pipeline/rules";
import { slugify } from "@/pipeline/normalise";
import { sha256 } from "@/lib/fetcher";

const blank = (v: unknown) => (v === "" ? undefined : v);
const Body = z.object({
  source: z.enum(["ETEA", "FPSC", "KPPSC", "PPSC", "SPSC", "BPSC", "NTS", "Daily Aaj", "Daily Jang", "Nawa-i-Waqt", "Daily Mashriq"]),
  title: z.string().trim().min(5).max(200),
  department: z.preprocess(blank, z.string().trim().max(200).optional()),
  bps: z.preprocess(blank, z.coerce.number().int().min(1).max(22).optional()),
  vacancies: z.preprocess(blank, z.coerce.number().int().min(1).max(100000).optional()),
  education: z.preprocess(blank, z.string().trim().max(200).optional()),
  city: z.preprocess(blank, z.string().trim().max(80).optional()),
  lastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  officialUrl: z.string().url(),
  applyUrl: z.preprocess(blank, z.string().url().optional()),
});
type R = Record<string, unknown>;
const rows = (r: unknown) => ((r as { rows?: R[] }).rows ?? r) as R[];
/** Human-in-the-loop path for sources that refuse our server (e.g. ETEA returns 403). The admin copies facts from the official ad;
 *  the same deterministic rules engine gates publishing. Manual entries are NEVER "Verified". */
export async function POST(req: NextRequest) {
  if (!isAdmin(req.cookies.get("rd_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const p = Body.safeParse(Object.fromEntries((await req.formData()).entries()));
  if (!p.success) return NextResponse.json({ error: "invalid input", issues: p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  const b = p.data;
  const d = evaluate({ title: b.title, officialUrl: b.officialUrl, lastDate: b.lastDate, fieldsConfirmedAgainstSource: false });
  if (d.action !== "publish") return NextResponse.json({ error: "rules engine refused", reasons: d.reasons }, { status: 422 });
  const sr = rows(await db().execute(sql`insert into sources (key, name, base_url) values (${b.source}, ${b.source}, ${b.officialUrl}) on conflict (key) do update set key = excluded.key returning id`))[0];
  const slug = slugify(b.title, b.lastDate + "-" + sha256(b.officialUrl + b.title).slice(0, 6));
  await db().execute(sql`insert into jobs (slug, title, department, source_id, city, education, bps, vacancies, last_date, status, official_url, apply_url, dedupe_key, content_hash)
    values (${slug}, ${b.title}, ${b.department ?? null}, ${Number(sr.id)}, ${b.city ?? null}, ${b.education ?? null}, ${b.bps ?? null}, ${b.vacancies ?? null}, ${b.lastDate}, 'published', ${b.officialUrl}, ${b.applyUrl ?? null}, ${slug + "|" + b.lastDate}, ${sha256("manual|" + slug)})
    on conflict (slug) do nothing`);
  return NextResponse.redirect(new URL("/admin?added=1", req.url), 303);
}

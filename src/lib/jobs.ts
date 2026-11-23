import { sql } from "drizzle-orm";
import type { JobView, SourceKey } from "./types";
import { SEED } from "./seed";
import { db, hasDb } from "@/db";
import { ensureApplyHow } from "./applyHow";
import { normJob } from "./normalize";

export interface JobQuery { q?: string; province?: string; bpsMin?: number; bpsMax?: number; source?: string[]; closingWithin?: number; sort?: "closing" | "vacancies"; cursor?: string; limit?: number; includeClosed?: boolean }
type Row = Record<string, unknown>;
const toView = (r: Row): JobView => normJob({
  id: Number(r.id), slug: String(r.slug), title: String(r.title), department: String(r.department ?? ""), source: String(r.source_key) as SourceKey,
  province: String(r.province ?? ""), city: String(r.city ?? ""), bps: r.bps == null ? null : Number(r.bps), vacancies: r.vacancies == null ? null : Number(r.vacancies),
  lastDate: r.last_date ? String(r.last_date).slice(0, 10) : "", education: String(r.education ?? ""),
  age: r.age_min || r.age_max ? `${r.age_min ?? ""}${r.age_min && r.age_max ? " to " : ""}${r.age_max ?? ""} years` : "", verified: r.verified_at != null, officialUrl: String(r.official_url),
  added: r.created_at ? new Date(String(r.created_at)).toISOString().slice(0, 10) : undefined,
} as JobView);

export async function queryJobs(p: JobQuery): Promise<{ jobs: JobView[]; nextCursor: string | null }> {
  const limit = Math.min(p.limit ?? 50, 100);
  if (!hasDb()) { // sample mode
    let j = SEED.filter((x) => !p.q || (x.title + x.department + x.city).toLowerCase().includes(p.q.toLowerCase()));
    if (p.province) j = j.filter((x) => x.province === p.province);
    return { jobs: j.slice(0, limit).map(normJob), nextCursor: null };
  }
  const w = [p.includeClosed ? sql`j.status in ('published','closed')` : sql`j.status = 'published' and (j.last_date is null or j.last_date >= current_date)`];
  if (p.q) w.push(sql`(j.search_tsv @@ plainto_tsquery('simple', ${p.q}) or j.title % ${p.q} or j.title ilike ${"%" + p.q + "%"} or j.department ilike ${"%" + p.q + "%"})`);
  if (p.province) w.push(sql`j.province = ${p.province}`);
  if (p.bpsMin != null) w.push(sql`j.bps >= ${p.bpsMin}`);
  if (p.bpsMax != null) w.push(sql`j.bps <= ${p.bpsMax}`);
  if (p.source?.length) w.push(sql`s.key in (${sql.join(p.source.map((x) => sql`${x}`), sql`, `)})`);
  if (p.closingWithin) w.push(sql`j.last_date <= current_date + ${p.closingWithin}::int`);
  if (p.cursor) { const [d, id] = Buffer.from(p.cursor, "base64url").toString().split("|"); w.push(sql`(j.last_date, j.id) > (${d}::date, ${Number(id)})`); }
  const order = p.sort === "vacancies" ? sql`j.vacancies desc nulls last, j.id` : sql`j.last_date asc nulls last, j.id`;
  const res = await db().execute(sql`select j.*, s.key as source_key from jobs j join sources s on s.id = j.source_id where ${sql.join(w, sql` and `)} order by ${order} limit ${limit + 1}`);
  const rows = (res.rows ?? res) as Row[];
  const more = rows.length > limit; const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return { jobs: page.map(toView), nextCursor: more && last && p.sort !== "vacancies" ? Buffer.from(`${String(last.last_date).slice(0, 10)}|${last.id}`).toString("base64url") : null };
}
export const getJobs = async () => ({ jobs: (await queryJobs({ limit: 100 })).jobs, sample: !hasDb() });

export async function getJobBySlug(slug: string): Promise<(JobView & { files: { label: string; url: string; kind: string }[]; status: string; postedDate?: string; applyHow?: string }) | null> {
  if (!hasDb()) { const j = SEED.find((x) => x.slug === slug); return j ? { ...normJob(j), files: [], status: "sample" } : null; }
  await ensureApplyHow().catch(() => {});
  const res = await db().execute(sql`select j.*, s.key as source_key from jobs j join sources s on s.id = j.source_id where j.slug = ${slug} and j.status in ('published','closed') limit 1`);
  const row = ((res.rows ?? res) as Row[])[0]; if (!row) return null;
  const f = await db().execute(sql`select label, url, kind from job_files where job_id = ${Number(row.id)}`);
  return { ...toView(row), files: (f.rows ?? f) as never, status: String(row.status), applyHow: row.apply_how ? String(row.apply_how) : undefined, postedDate: row.posted_date ? String(row.posted_date).slice(0, 10) : undefined };
}
export async function allSlugs(): Promise<{ slug: string; updated: string }[]> {
  if (!hasDb()) return [];
  const r = await db().execute(sql`select slug, updated_at from jobs where status = 'published' and (last_date is null or last_date >= current_date) order by updated_at desc limit 5000`);
  return ((r.rows ?? r) as Row[]).map((x) => ({ slug: String(x.slug), updated: new Date(String(x.updated_at)).toISOString() }));
}

/** Up to `limit` other open jobs, same department first, then same city, then same province. */
export async function relatedJobs(j: JobView, limit = 6): Promise<JobView[]> {
  if (!hasDb()) return SEED.map(normJob).filter((x) => x.id !== j.id && (x.department === j.department || x.city === j.city || x.province === j.province)).slice(0, limit);
  const res = await db().execute(sql`select j.*, s.key as source_key from jobs j join sources s on s.id = j.source_id
    where j.status = 'published' and (j.last_date is null or j.last_date >= current_date) and j.id <> ${j.id}
      and (j.department = ${j.department} or j.city = ${j.city} or j.province = ${j.province})
    order by (j.department = ${j.department}) desc, (j.city = ${j.city}) desc, j.created_at desc limit ${limit}`);
  return ((res.rows ?? res) as Row[]).map(toView);
}

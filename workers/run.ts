import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { politeFetch, sha256 } from "../src/lib/fetcher";
import { parseEtea } from "../src/parsers/etea";
import { parseKppsc } from "../src/parsers/kppsc";
import { parseFpsc } from "../src/parsers/fpsc";
import { evaluate } from "../src/pipeline/rules";
import { slugify } from "../src/pipeline/normalise";
import { extractFromImage } from "../src/pipeline/extract";
import type { ParseResult } from "../src/parsers/types";

const SOURCES: Record<string, { name: string; url: string; parse: (h: string) => ParseResult }> = {
  ETEA: { name: "ETEA", url: "https://etea.online/", parse: parseEtea },
  KPPSC: { name: "KPPSC", url: "https://www.kppsc.gov.pk/advertisement", parse: parseKppsc },
  FPSC: { name: "FPSC", url: "https://www.fpsc.gov.pk/category/advertisements", parse: parseFpsc },
};
const rows = (r: unknown) => ((r as { rows?: unknown[] }).rows ?? r) as Record<string, unknown>[];
const DRY = process.argv.includes("--dry");
const only = process.argv.find((a) => a.startsWith("--source="))?.split("=")[1];

async function runSource(key: string) {
  const s = SOURCES[key]; const errors: { type: string; message: string }[] = []; let seen = 0, fresh = 0;
  const sr = rows(await db().execute(sql`insert into sources (key, name, base_url) values (${key}, ${s.name}, ${s.url}) on conflict (key) do update set base_url = excluded.base_url returning id, etag, enabled`))[0];
  if (!sr.enabled) return { key, skipped: "disabled" };
  const run = rows(await db().execute(sql`insert into ingest_runs (source_id) values (${Number(sr.id)}) returning id`))[0];
  let status = "ok";
  try {
    const f = await politeFetch(s.url, { etag: sr.etag as string | null });
    if (f.notModified) status = "not_modified";
    else {
      await db().execute(sql`insert into raw_items (source_id, url, content_hash, kind) values (${Number(sr.id)}, ${s.url}, ${f.hash!}, 'html') on conflict (content_hash) do nothing`);
      const parsed = s.parse(f.text ?? "");
      if (parsed.broken) { status = "parser_broken"; errors.push({ type: "parser_broken", message: parsed.note ?? "" }); }
      if (parsed.emptyState) errors.push({ type: "empty_state", message: "source reports no active advertisements" });
      seen = parsed.items.length;
      for (const it of parsed.items) {
        let facts: Awaited<ReturnType<typeof extractFromImage>> | null = null;
        const jobHash = sha256(`${key}|${it.externalId}|${it.title}|${it.lastDate}`);
        const exists = rows(await db().execute(sql`select 1 from jobs where source_id = ${Number(sr.id)} and content_hash = ${jobHash}`)).length > 0;
        if (exists) continue;
        if (it.needsAi && !DRY) { try { const img = await politeFetch(it.officialUrl, { binary: true }); facts = await extractFromImage(img.body!, it.officialUrl); } catch (e) { errors.push({ type: "ai", message: String(e) }); } }
        const f2 = facts && "facts" in facts ? facts : null;
        const lastDate = it.lastDate ?? f2?.facts.last_date ?? null;
        const d = evaluate({ title: it.title, officialUrl: it.officialUrl, lastDate, aiUsed: !!f2, aiConfidence: f2?.facts.confidence, fieldsConfirmedAgainstSource: it.fieldsConfirmedAgainstSource });
        if (f2 && !f2.facts.is_recruitment_ad) d.action = "reject";
        fresh++; if (DRY) continue;
        const slug = slugify(it.title, it.externalId);
        const ins = rows(await db().execute(sql`insert into jobs (slug, title, department, source_id, province, city, bps, vacancies, education, age_min, age_max, last_date, status, confidence, official_url, apply_url, dedupe_key, content_hash, verified_at)
          values (${slug}, ${it.title}, ${f2?.facts.department ?? null}, ${Number(sr.id)}, ${f2?.facts.province ?? null}, ${f2?.facts.city ?? null}, ${f2?.facts.bps ?? it.bps ?? null}, ${f2?.facts.vacancies ?? null}, ${f2?.facts.education ?? null}, ${f2?.facts.age_min ?? null}, ${f2?.facts.age_max ?? null},
          ${lastDate}, ${d.action === "publish" ? "published" : d.action === "reject" ? "rejected" : "quarantined"}, ${f2?.facts.confidence ?? null}, ${it.officialUrl}, ${it.applyUrl ?? null}, ${slug + "|" + lastDate}, ${jobHash}, ${d.verified ? sql`now()` : null})
          on conflict (slug) do nothing returning id`))[0];
        if (ins) { for (const fl of it.files) await db().execute(sql`insert into job_files (job_id, label, url, kind) values (${Number(ins.id)}, ${fl.label}, ${fl.url}, ${fl.kind})`);
          if (d.action === "quarantine") await db().execute(sql`insert into review_queue (job_id, reason) values (${Number(ins.id)}, ${d.reasons.join("; ")})`); }
      }
      if (!DRY) await db().execute(sql`update sources set etag = ${f.etag ?? null} where id = ${Number(sr.id)}`);
    }
  } catch (e) { status = "error"; errors.push({ type: "fetch", message: String(e) }); }
  if (!DRY) { await db().execute(sql`update ingest_runs set finished_at = now(), items_seen = ${seen}, items_new = ${fresh}, errors = ${JSON.stringify(errors)}::jsonb where id = ${Number(run.id)}`);
    await db().execute(sql`update sources set last_checked_at = now(), last_status = ${status} where id = ${Number(sr.id)}`); }
  return { key, status, seen, new: fresh, errors };
}
(async () => {
  const keys = Object.keys(SOURCES).filter((k) => !only || k === only); const out = [];
  for (const k of keys) out.push(await runSource(k));
  console.log(JSON.stringify({ dry: DRY, results: out }, null, 2));
  process.exit(out.some((r) => "status" in r && r.status === "error") ? 1 : 0);
})();

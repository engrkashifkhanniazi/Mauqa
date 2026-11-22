// Newspaper pipeline. Reads edition page images IN MEMORY, asks Claude for facts only, stores facts + a link to the publisher page.
// It never stores or republishes page images or ad text. Needs ANTHROPIC_API_KEY (+ optional CLAUDE_MONTHLY_BUDGET_USD, default cap 8 USD).
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { politeFetch, sha256 } from "@/lib/fetcher";
import { evaluate } from "@/pipeline/rules";
import { slugify } from "@/pipeline/normalise";
import { BudgetStop, extractPageAds, pageHasJobAds } from "@/pipeline/paperAi";

const DRY = process.argv.includes("--dry");
type R = Record<string, unknown>;
const rows = (r: unknown) => ((r as { rows?: R[] }).rows ?? r) as R[];
const MAX_PAGES = 40;

interface Paper { key: "Daily Mashriq" | "Daily Jang" | "Nawa-i-Waqt"; fromHtml?: (html: string) => string | null; label: string; home: string; pageUrl: (t: Date, n: number) => string; imageUrl: (t: Date, n: number) => string }
const pad = (x: number) => String(x).padStart(2, "0");
const DMY = (t: Date) => `${pad(t.getUTCDate())}-${pad(t.getUTCMonth() + 1)}-${t.getUTCFullYear()}`;
const MDY = (t: Date) => `${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}-${t.getUTCFullYear()}`;
const jang = (city: string): Paper => ({ key: "Daily Jang", label: `Jang ${city}`, home: "https://e.jang.com.pk/",
  pageUrl: (t, n) => `https://e.jang.com.pk/${city}/${DMY(t)}/page${n}`, imageUrl: (t, n) => `https://e.jang.com.pk/static_pages/${MDY(t)}/${city}/mainpage/page${n}.jpg` });
// To add a paper: find how its e-paper serves page images (see docs in README) and add an entry here. Papers that block bots (Cloudflare checks) are NOT added.
const PAPERS: Paper[] = [
  { key: "Daily Mashriq", label: "Mashriq Peshawar", home: "https://mashriqtv.pk/e-paper/", pageUrl: (t, n) => `https://mashriqtv.pk/e-paper/?pageno=${n}&date=${DMY(t)}`,
    imageUrl: (t, n) => `https://mashriqtv.pk/daily-mashriq/uploads/mashriqnp/${DMY(t)}/mas-${DMY(t)}-${n}.jpg` },
  jang("lahore"), jang("karachi"), jang("pindi"),
];
async function pageImage(p: Paper, t: Date, n: number) {
  let img = p.imageUrl(t, n);
  if (p.fromHtml) { const h = await politeFetch(p.pageUrl(t, n)); if (h.status !== 200) return null; const u = p.fromHtml(h.text ?? Buffer.from(h.body ?? []).toString("utf8")); if (!u) return null; img = u; }
  const r = await politeFetch(img, { binary: true, referer: p.pageUrl(t, n) });
  return r.status === 200 && r.body && /image/i.test(r.contentType ?? "") ? { ...r, body: r.body } : null;
}
const edition = (off: number) => new Date(Date.now() + 5 * 3600e3 - off * 86400e3); // Pakistan time

async function main() {
  if (process.argv.includes("--probe")) { // connectivity check only: no AI, no DB
    for (const p of PAPERS) for (const off of [0, 1]) { const t = edition(off); try { const r = await pageImage(p, t, 1); console.log(`probe ${p.label} ${DMY(t)} page1 ${r ? `ok bytes=${r.body?.length}` : "not available"}`); } catch (e) { console.log(`probe ${p.label} ${DMY(t)} error:`, (e as Error).message); } }
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) { console.log("newspaper pipeline waiting: ANTHROPIC_API_KEY is not set yet. Nothing to do."); return; }
  for (const paper of PAPERS) {
    const sr = DRY ? { id: 0 } : rows(await db().execute(sql`insert into sources (key, name, base_url) values (${paper.key}, ${paper.key}, ${paper.home}) on conflict (key) do update set key = excluded.key returning id`))[0];
    for (const off of [0, 1]) { // today's edition, else yesterday's
      const t = edition(off); const d = DMY(t); let pages = 0, adsFound = 0, published = 0, queued = 0;
      for (let n = 1; n <= MAX_PAGES; n++) {
        let img: Uint8Array | undefined;
        try { const r = await pageImage(paper, t, n); if (!r) break; img = r.body; } catch { break; }
        pages++;
        const hash = sha256(img);
        if (rows(await db().execute(sql`select 1 from raw_items where content_hash = ${hash}`)).length) continue; // page already processed
        try {
          const buf = Buffer.from(img);
          if (!(await pageHasJobAds(buf))) { if (!DRY) await db().execute(sql`insert into raw_items (source_id, url, content_hash, kind) values (${Number(sr.id)}, ${paper.pageUrl(t, n)}, ${hash}, 'page') on conflict (content_hash) do nothing`); continue; }
          const ads = await extractPageAds(buf); adsFound += ads.length;
          const url = paper.pageUrl(t, n);
          for (const a of ads) {
            const dec = evaluate({ regionText: [a.department, a.city].filter(Boolean).join(" "), title: a.title, officialUrl: url, lastDate: a.last_date, aiUsed: true, aiConfidence: a.confidence });
            if (dec.action === "reject" || DRY) continue;
            const slug = slugify(a.title, `${paper.key}-${a.last_date ?? d}-${sha256(a.title + (a.department ?? "")).slice(0, 6)}`);
            const ins = rows(await db().execute(sql`insert into jobs (slug, title, department, source_id, province, city, bps, vacancies, education, last_date, status, confidence, official_url, dedupe_key, content_hash, verified_at)
              values (${slug}, ${a.title}, ${a.department}, ${Number(sr.id)}, ${a.province}, ${a.city}, ${a.bps}, ${a.vacancies}, ${a.education}, ${a.last_date}, ${dec.action === "publish" ? "published" : "quarantined"}, ${a.confidence}, ${url}, ${slug + "|" + a.last_date}, ${sha256("paper|" + slug)}, null)
              on conflict (slug) do nothing returning id`))[0];
            if (ins) { if (dec.action === "publish") published++; else { queued++; await db().execute(sql`insert into review_queue (job_id, reason) values (${Number(ins.id)}, ${dec.reasons.join("; ")})`); } }
          }
          if (!DRY) await db().execute(sql`insert into raw_items (source_id, url, content_hash, kind) values (${Number(sr.id)}, ${url}, ${hash}, 'page') on conflict (content_hash) do nothing`);
        } catch (e) { if (e instanceof BudgetStop) { console.log("stopped:", e.message); return; } console.log(`page ${n} error:`, (e as Error).message); }
      }
      console.log(`${paper.label} ${d}: pages=${pages} ads=${adsFound} published=${published} queued=${queued}`);
      if (pages > 0) break;
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

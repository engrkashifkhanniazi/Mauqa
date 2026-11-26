// Newspaper pipeline. Reads edition page images IN MEMORY, asks Claude for facts only, stores facts + a link to the publisher page.
// It keeps no page images or ad text; it keeps only a cropped picture of each ad when the box is trustworthy, shown on the job page next to the link. Needs ANTHROPIC_API_KEY (+ optional CLAUDE_MONTHLY_BUDGET_USD, default cap 8 USD).
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { politeFetch, sha256 } from "@/lib/fetcher";
import { evaluate } from "@/pipeline/rules";
import { slugify } from "@/pipeline/normalise";
import { BudgetStop, extractPageAds, pageHasJobAds } from "@/pipeline/paperAi";
import { saveAdBuffer } from "@/lib/adImage";

const DRY = process.argv.includes("--dry");
type R = Record<string, unknown>;
const rows = (r: unknown) => ((r as { rows?: R[] }).rows ?? r) as R[];
const MAX_PAGES = 40;

interface Paper { key: "Daily Mashriq" | "Daily Jang" | "Nawa-i-Waqt" | "Daily Ausaf" | "Daily Express" | "Daily Aaj"; fromHtml?: (html: string) => string | null; listPages?: (t: Date) => Promise<string[]>; label: string; home: string; pageUrl: (t: Date, n: number) => string; imageUrl: (t: Date, n: number) => string }
const pad = (x: number) => String(x).padStart(2, "0");
const DMY = (t: Date) => `${pad(t.getUTCDate())}-${pad(t.getUTCMonth() + 1)}-${t.getUTCFullYear()}`;
const MDY = (t: Date) => `${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}-${t.getUTCFullYear()}`;
const jang = (city: string): Paper => ({ key: "Daily Jang", label: `Jang ${city}`, home: "https://e.jang.com.pk/",
  pageUrl: (t, n) => `https://e.jang.com.pk/${city}/${DMY(t)}/page${n}`, imageUrl: (t, n) => `https://e.jang.com.pk/static_pages/${MDY(t)}/${city}/mainpage/page${n}.jpg` });
// To add a paper: find how its e-paper serves page images (see docs in README) and add an entry here. Papers that block bots (Cloudflare checks) are NOT added.
const YMD = (t: Date) => `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
const nawa = (city: string): Paper => ({ key: "Nawa-i-Waqt", label: `Nawa-i-Waqt ${city}`, home: "https://www.nawaiwaqt.com.pk/E-Paper/", pageUrl: (t, n) => `https://www.nawaiwaqt.com.pk/E-Paper/${city}/${YMD(t)}/page-${n}`, imageUrl: () => "",
  fromHtml: (h) => h.match(/https:\/\/www\.nawaiwaqt\.com\.pk\/epaper_image\/large\/[^"'\s]+\.jpg/)?.[0] ?? null });
// Ausaf lists every page of an edition on one page (thumbnail ids); the full-size image has the same id with "-full".
const ausaf = (label: string, station: string): Paper => ({ key: "Daily Ausaf", label, home: "https://epaper.dailyausaf.com/", pageUrl: () => `https://epaper.dailyausaf.com/page${station}`, imageUrl: () => "",
  listPages: async (t) => { const h = await politeFetch(`https://epaper.dailyausaf.com/page${station}`); if (h.status !== 200) return [];
    return [...new Set([...(h.text ?? "").matchAll(/issues\/(\d{4}-\d{2}-\d{2})\/(\d+)-thumb\.jpg/g)].filter((m) => m[1] === YMD(t)).map((m) => `https://epaper.dailyausaf.com/issues/${m[1]}/${m[2]}-full.jpg`))]; } });
// Express serves every page of an edition on one index page: thumbnails ("-thumb.jpg") whose full-size picture has the same name without "-thumb".
const express = (issue: string, label: string): Paper => ({ key: "Daily Express", label, home: "https://www.express.com.pk/epaper/Index.aspx", imageUrl: () => "",
  pageUrl: (t, n) => `https://www.express.com.pk/epaper/Index.aspx?Issue=${issue}&Page=FRONT_PAGE&Date=${YMD(t).replace(/-/g, "")}&Pageno=${n}&View=1`,
  listPages: async (t) => { const d = YMD(t).replace(/-/g, ""); const h = await politeFetch(`https://www.express.com.pk/epaper/Index.aspx?Issue=${issue}&Page=FRONT_PAGE&Date=${d}&Pageno=1&View=1`); if (h.status !== 200) return [];
    const found = [...(h.text ?? "").matchAll(new RegExp(`/images/${issue}/${d}/[A-Za-z0-9_-]+?(-thumb)?\\.jpg`, "g"))].map((m) => ({ u: m[0].replace("-thumb", ""), thumb: !!m[1] }));
    const pageNo = (u: string) => Number(u.match(/_(\d+)\.jpg$/)?.[1] ?? 0);
    return [...new Set(found.map((f) => f.u))].filter((u) => !/Front_Page_1\.jpg$/.test(u)).sort((a, b) => pageNo(a) - pageNo(b)).map((u) => "https://www.express.com.pk" + u); } });
// Aaj: the home page lists the newest edition's page numbers; each page is a form post whose answer holds the page picture.
const aaj = (edition: string, label: string): Paper => ({ key: "Daily Aaj", label, home: "https://epaper.dailyaaj.com.pk/", imageUrl: () => "", pageUrl: () => "https://epaper.dailyaaj.com.pk/",
  listPages: async (t) => { const h = await politeFetch("https://epaper.dailyaaj.com.pk/"); if (h.status !== 200) return [];
    const html = h.text ?? ""; if (html.match(/name="dated"[^>]*value="([^"]+)"/)?.[1] !== YMD(t)) return []; // newest edition on the site is not this day
    const id = html.match(/name="epaper_id"[^>]*value="(\d+)"/)?.[1]; const cookie = (h.setCookie ?? "").split(/,(?=\s*\w+=)/).map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ");
    const pages = [...new Set([...html.matchAll(/<option[^>]*value="(\d+)"/g)].map((m) => m[1]))]; const out: string[] = [];
    for (const pg of pages.slice(0, 40)) {
      const r = await politeFetch("https://epaper.dailyaaj.com.pk/main/epaper", { form: { epaper_id: id ?? "", epaperpage: pg, epapertype: edition, date: `${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}-${t.getUTCFullYear()}`, dated: YMD(t) }, cookie, referer: "https://epaper.dailyaaj.com.pk/" });
      const u = (r.text ?? "").match(/https:\/\/epaper\.dailyaaj\.com\.pk\/\.?\/epaper\/[0-9a-f]{20,}\.jpg/)?.[0]; if (u) out.push(u.replace("/./", "/"));
    }
    return [...new Set(out)]; } });
const listCache = new Map<string, string[]>();
const PAPERS: Paper[] = [
  { key: "Daily Mashriq", label: "Mashriq Peshawar", home: "https://mashriqtv.pk/e-paper/", pageUrl: (t, n) => `https://mashriqtv.pk/e-paper/?pageno=${n}&date=${DMY(t)}`,
    imageUrl: (t, n) => `https://mashriqtv.pk/daily-mashriq/uploads/mashriqnp/${DMY(t)}/mas-${DMY(t)}-${n}.jpg` },
  nawa("islamabad"), ausaf("Ausaf Islamabad", ""),
  express("NP_ISB", "Express Islamabad"),
  aaj("peshawar", "Aaj Peshawar"),
  jang("pindi"), // one edition per paper where possible: federal ads repeat across editions and each page costs API money
];
async function pageImage(p: Paper, t: Date, n: number) {
  let img = p.imageUrl(t, n);
  if (p.listPages) { const k = `${p.label}|${YMD(t)}`; if (!listCache.has(k)) listCache.set(k, await p.listPages(t)); const u = listCache.get(k)![n - 1]; if (!u) return null; img = u; }
  else if (p.fromHtml) { const h = await politeFetch(p.pageUrl(t, n)); if (h.status !== 200) return null; const u = p.fromHtml(h.text ?? Buffer.from(h.body ?? []).toString("utf8")); if (!u) return null; img = u; }
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
        if (rows(await db().execute(sql`select 1 from raw_items where content_hash = ${hash} and kind = 'page2'`)).length) continue; // page already checked by the current page check (kind "page" = old check, read again)
        try {
          const buf = Buffer.from(img);
          if (!(await pageHasJobAds(buf))) { if (!DRY) await db().execute(sql`insert into raw_items (source_id, url, content_hash, kind) values (${Number(sr.id)}, ${paper.pageUrl(t, n)}, ${hash}, 'page2') on conflict (content_hash) do update set kind = 'page2'`); continue; }
          const ads = await extractPageAds(buf); adsFound += ads.length;
          const url = paper.pageUrl(t, n);
          for (const a of ads) {
            const dec = evaluate({ regionText: [a.department, a.city].filter(Boolean).join(" "), title: a.title, officialUrl: url, lastDate: a.last_date, aiUsed: true, aiConfidence: a.confidence });
            if (dec.action === "reject" || DRY) continue;
            const slug = slugify(a.title, `${paper.key}-${a.last_date ?? d}-${sha256(a.title + (a.department ?? "")).slice(0, 6)}`);
            const ins = rows(await db().execute(sql`insert into jobs (slug, title, department, source_id, province, city, bps, vacancies, education, last_date, status, confidence, official_url, dedupe_key, content_hash, verified_at)
              values (${slug}, ${a.title}, ${a.department}, ${Number(sr.id)}, ${a.province}, ${a.city}, ${a.bps}, ${a.vacancies}, ${a.education}, ${a.last_date}, ${dec.action === "publish" ? "published" : "quarantined"}, ${a.confidence}, ${url}, ${slug + "|" + a.last_date}, ${sha256("paper|" + slug)}, null)
              on conflict (slug) do nothing returning id`))[0];
            if (ins && a.crop) await saveAdBuffer(Number(ins.id), a.crop).catch(() => undefined); // picture is a bonus: never block the post
            if (ins) { if (dec.action === "publish") published++; else { queued++; await db().execute(sql`insert into review_queue (job_id, reason) values (${Number(ins.id)}, ${dec.reasons.join("; ")})`); } }
          }
          if (!DRY) await db().execute(sql`insert into raw_items (source_id, url, content_hash, kind) values (${Number(sr.id)}, ${url}, ${hash}, 'page2') on conflict (content_hash) do update set kind = 'page2'`);
        } catch (e) { if (e instanceof BudgetStop) { console.log("stopped:", e.message); return; } console.log(`page ${n} error:`, (e as Error).message); }
      }
      console.log(`${paper.label} ${d}: pages=${pages} ads=${adsFound} published=${published} queued=${queued}`);
      if (pages > 0) break;
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
import { evaluate } from "@/pipeline/rules";
import { slugify } from "@/pipeline/normalise";
import { sha256 } from "@/lib/fetcher";
import { parsePaste, type Cand } from "@/lib/pasteParse";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const page = (b: string) => new NextResponse(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Paste import</title><body style="font:16px system-ui;padding:16px;max-width:720px;margin:auto">${b}</body>`, { headers: { "content-type": "text/html; charset=utf-8" } });
type R = Record<string, unknown>;
const rows = (r: unknown) => ((r as { rows?: R[] }).rows ?? r) as R[];
const SOURCES = ["ETEA", "FPSC", "KPPSC", "PPSC", "SPSC", "BPSC", "NTS"];

/** Human-in-the-loop bulk import: the admin copies text from an official page they can open themselves.
 *  Step 1 shows a preview; step 2 publishes only ticked rows, each through evaluate(). Never "Verified". */
export async function POST(req: NextRequest) {
  if (!isAdmin(req.cookies.get("rd_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const f = await req.formData();
  const source = String(f.get("source") ?? ""); const officialUrl = String(f.get("officialUrl") ?? "");
  if (!SOURCES.includes(source)) return page("<p>Bad source.</p>");
  try { new URL(officialUrl); } catch { return page("<p>Official URL must be a full link (https://...). <a href=/admin>Back</a></p>"); }
  if (f.get("confirm")) {
    const all = JSON.parse(String(f.get("data") ?? "[]")) as Cand[];
    const picked = new Set(f.getAll("pick").map(String));
    const sr = rows(await db().execute(sql`insert into sources (key, name, base_url) values (${source}, ${source}, ${officialUrl}) on conflict (key) do update set key = excluded.key returning id`))[0];
    let ok = 0, refused = 0;
    for (let i = 0; i < all.length; i++) {
      if (!picked.has(String(i))) continue;
      const c = all[i];
      const d = evaluate({ title: c.title, officialUrl, lastDate: c.lastDate, fieldsConfirmedAgainstSource: false });
      if (d.action !== "publish") { refused++; continue; }
      const slug = slugify(c.title, c.lastDate + "-" + sha256(officialUrl + c.title).slice(0, 6));
      await db().execute(sql`insert into jobs (slug, title, department, source_id, city, bps, vacancies, last_date, status, official_url, apply_url, dedupe_key, content_hash)
        values (${slug}, ${c.title}, ${null}, ${Number(sr.id)}, ${null}, ${c.bps ?? null}, ${c.vacancies ?? null}, ${c.lastDate}, 'published', ${officialUrl}, ${null}, ${slug + "|" + c.lastDate}, ${sha256("paste|" + slug)}) on conflict (slug) do nothing`);
      ok++;
    }
    return page(`<h2>Done</h2><p>${ok} published (unverified), ${refused} refused by the rules engine.</p><p><a href=/>See site</a> · <a href=/admin>Admin</a></p>`);
  }
  const cands = parsePaste(String(f.get("text") ?? "")).slice(0, 100);
  if (!cands.length) return page("<p>No lines with a closing date were found. Each job needs its date on the same line. <a href=/admin>Back</a></p>");
  const list = cands.map((c, i) => `<label style="display:block;margin:8px 0"><input type=checkbox name=pick value=${i} checked> ${esc(c.title)} <b>(last date ${c.lastDate})</b></label>`).join("");
  return page(`<h2>Check before publishing (${cands.length})</h2><p>Untick anything that is not a job. They will show as Unverified.</p><form method=post><input type=hidden name=source value="${esc(source)}"><input type=hidden name=officialUrl value="${esc(officialUrl)}"><input type=hidden name=confirm value=1><input type=hidden name=data value="${esc(JSON.stringify(cands))}">${list}<button style="padding:12px 18px;margin-top:12px">Publish ticked</button></form>`);
}

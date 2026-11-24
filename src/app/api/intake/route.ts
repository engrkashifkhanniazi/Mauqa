import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { evaluate, hostAllowed } from "@/pipeline/rules";
import { slugify } from "@/pipeline/normalise";
import { normProvince, normCity } from "@/lib/normalize";
import { ensureApplyHow } from "@/lib/applyHow";
import { saveAdImage } from "@/lib/adImage";
import { parsePaste } from "@/lib/pasteParse";
import { refreshSite } from "@/lib/refresh";
import { intakeTokenOk, sameAdKey, INTAKE_SOURCES } from "@/lib/intake";

/** Automatic posting from the daily laptop runs (Claude in Chrome reads e-papers / ETEA / OTS / PTS / NJP, which refuse GitHub).
 *  The e-paper tab sends one job line (paste format) + the cropped ad picture. Every line still goes through evaluate():
 *  outside KP/Islamabad, admissions, past dates and non-jobs are refused. Never marked Verified. */
const cors = (req: NextRequest): Record<string, string> => {
  const o = req.headers.get("origin") ?? "";
  const ok = !!o && (hostAllowed(o) || /^https:\/\/(mauqa|rozgardesk)\.vercel\.app$/.test(o));
  return ok ? { "access-control-allow-origin": o, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "x-mauqa-intake", vary: "origin" } : {};
};
export async function OPTIONS(req: NextRequest) { return new NextResponse(null, { status: 204, headers: cors(req) }); }

type R = Record<string, unknown>;
const rows = (r: unknown) => ((r as { rows?: R[] }).rows ?? r) as R[];

export async function POST(req: NextRequest) {
  const h = cors(req);
  const out = (body: R, status = 200) => NextResponse.json(body, { status, headers: h });
  if (!intakeTokenOk(req.headers.get("x-mauqa-intake"))) return out({ error: "unauthorized" }, 401);
  let f: FormData; try { f = await req.formData(); } catch { return out({ error: "send multipart/form-data" }, 400); }
  const source = String(f.get("source") ?? ""); const officialUrl = String(f.get("officialUrl") ?? ""); const dry = f.get("dry") === "1";
  if (!INTAKE_SOURCES.includes(source)) return out({ error: "unknown source", allowed: INTAKE_SOURCES }, 400);
  try { if (!/^https:\/\//.test(officialUrl)) throw 0; new URL(officialUrl); } catch { return out({ error: "officialUrl must be a full https link" }, 400); }
  const c = parsePaste(String(f.get("line") ?? ""))[0];
  if (!c) return out({ error: "line must be title;;department;;city;;vacancies;;bps;;education;;YYYY-MM-DD[;;how to apply]" }, 400);
  const d = evaluate({ regionText: [c.department, c.city].filter(Boolean).join(" "), title: c.title, officialUrl, lastDate: c.lastDate, fieldsConfirmedAgainstSource: false });
  if (d.action !== "publish") return out({ status: "refused", reasons: d.reasons, title: c.title });
  const key = sameAdKey(c.title, c.lastDate, c.department);
  const slug = slugify(c.title, c.lastDate + "-" + key.slice(0, 6));
  if (dry) return out({ status: "ok-dry-run", slug, title: c.title, lastDate: c.lastDate });

  const dup = rows(await db().execute(sql`select slug from jobs where dedupe_key = ${key} or slug = ${slug}
    or (lower(title) = lower(${c.title}) and last_date = ${c.lastDate}) limit 1`))[0];
  if (dup) return out({ status: "duplicate", slug: dup.slug });

  await ensureApplyHow();
  const sr = rows(await db().execute(sql`insert into sources (key, name, base_url) values (${source}, ${source}, ${officialUrl}) on conflict (key) do update set key = excluded.key returning id`))[0];
  const ins = rows(await db().execute(sql`insert into jobs (slug, title, department, source_id, city, province, education, bps, vacancies, last_date, status, official_url, apply_url, apply_how, dedupe_key, content_hash)
    values (${slug}, ${c.title}, ${c.department ?? null}, ${Number(sr.id)}, ${c.city ? normCity(c.city) : null}, ${normProvince("", c.city ?? "", c.department ?? "", source)}, ${c.education ?? null}, ${c.bps ?? null}, ${c.vacancies ?? null}, ${c.lastDate}, 'published', ${officialUrl}, ${null}, ${c.applyHow ?? null}, ${key}, ${"intake|" + key})
    on conflict (slug) do nothing returning id`))[0];
  if (!ins) return out({ status: "duplicate", slug });
  const img = f.get("adImage");
  let picture = false;
  if (img instanceof File && img.size > 0 && img.size < 8_000_000) { try { await saveAdImage(Number(ins.id), img); picture = true; } catch { /* job stays without a picture */ } }
  refreshSite();
  return out({ status: "published", slug, url: `/jobs/${slug}`, picture });
}

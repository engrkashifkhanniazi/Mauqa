import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { isAdmin } from "@/lib/adminAuth";
import { saveAdImage, ensureAdImageTable } from "@/lib/adImage";
import { hostAllowed, ALLOWED_DOMAINS } from "@/pipeline/rules";
import { uploadCodeOk } from "@/lib/uploadCode";
/** e-paper sites may call this with an upload code (no cookie crosses sites) */
const cors = (req: NextRequest) => { const o = req.headers.get("origin") ?? ""; let ok = false; try { ok = hostAllowed(o) && ALLOWED_DOMAINS.length > 0; } catch {} return ok ? { "access-control-allow-origin": o, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "x-rd-upload", vary: "origin" } : {}; };
export async function OPTIONS(req: NextRequest) { return new NextResponse(null, { status: 204, headers: cors(req) }); }
type R = Record<string, unknown>;
const rows = (r: unknown) => ((r as { rows?: R[] }).rows ?? r) as R[];
/** Adds (or replaces) the ad picture of a job that is already live.
 *  Either an uploaded file ("adImage"), or "imageUrl" (an e-paper page picture on an allowed newspaper host) plus "box" = "left,top,right,bottom" as fractions 0..1 of that page: the server cuts that ad out. */
export async function POST(req: NextRequest) {
  const h = cors(req);
  if (!isAdmin(req.cookies.get("rd_admin")?.value) && !(await uploadCodeOk(req.headers.get("x-rd-upload") ?? ""))) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: h });
  const f = await req.formData(); const slug = String(f.get("slug") ?? "");
  const jr = rows(await db().execute(sql`select id from jobs where slug = ${slug} limit 1`))[0];
  if (!jr) return NextResponse.json({ error: "no job with that slug" }, { status: 404 });
  const file = f.get("adImage");
  if (file instanceof File && file.size > 0) { await saveAdImage(Number(jr.id), file); return NextResponse.json({ ok: true, slug }, { headers: h }); }
  const url = String(f.get("imageUrl") ?? ""); const box = String(f.get("box") ?? "").split(",").map(Number);
  if (!hostAllowed(url)) return NextResponse.json({ error: "image host not allowed" }, { status: 400 });
  if (box.length !== 4 || box.some((n) => !(n >= 0 && n <= 1)) || box[2] <= box[0] || box[3] <= box[1]) return NextResponse.json({ error: "box must be left,top,right,bottom fractions" }, { status: 400 });
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; RozgarDeskBot/1.0)", referer: new URL(url).origin + "/" }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) return NextResponse.json({ error: `fetch ${r.status}` }, { status: 502 });
  const page = Buffer.from(await r.arrayBuffer()); const m = await sharp(page).metadata(); const W = m.width ?? 0, H = m.height ?? 0;
  const left = Math.floor(box[0] * W), top = Math.floor(box[1] * H), width = Math.ceil((box[2] - box[0]) * W), height = Math.ceil((box[3] - box[1]) * H);
  const buf = await sharp(page).extract({ left, top, width: Math.min(width, W - left), height: Math.min(height, H - top) }).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  await ensureAdImageTable();
  await db().execute(sql`insert into job_images (job_id, mime, data) values (${Number(jr.id)}, 'image/jpeg', ${buf}) on conflict (job_id) do update set data = excluded.data, created_at = now()`);
  return NextResponse.json({ ok: true, slug, size: buf.length }, { headers: h });
}

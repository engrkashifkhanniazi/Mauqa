import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureAdImageTable } from "@/lib/adImage";
import { forPhone } from "@/lib/adServe";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureAdImageTable();
  const r = await db().execute(sql`select i.mime, encode(i.data, 'base64') as b64 from job_images i join jobs j on j.id = i.job_id where j.slug = ${slug} and j.status in ('published','closed') limit 1`);
  const row = (((r as { rows?: unknown[] }).rows ?? r) as { mime: string; b64: string }[])[0];
  if (!row) return new NextResponse("Not found", { status: 404 });
  const stored = Buffer.from(row.b64, "base64");
  let body: Buffer = stored, mime = row.mime;
  try { const big = await forPhone(stored); if (big !== stored) { body = big; mime = "image/jpeg"; } } catch { /* serve the stored picture as it is */ }
  return new NextResponse(new Uint8Array(body), { headers: { "content-type": mime, "cache-control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" } });
}

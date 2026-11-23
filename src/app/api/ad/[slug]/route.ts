import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureAdImageTable } from "@/lib/adImage";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureAdImageTable();
  const r = await db().execute(sql`select i.mime, encode(i.data, 'base64') as b64 from job_images i join jobs j on j.id = i.job_id where j.slug = ${slug} and j.status in ('published','closed') limit 1`);
  const row = (((r as { rows?: unknown[] }).rows ?? r) as { mime: string; b64: string }[])[0];
  if (!row) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Buffer.from(row.b64, "base64"), { headers: { "content-type": row.mime, "cache-control": "public, max-age=300, s-maxage=300" } });
}

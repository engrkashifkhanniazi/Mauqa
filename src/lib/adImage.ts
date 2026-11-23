import { sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";

/** Ad pictures are added by hand by the admin (newspapers that no robot reads). Stored small, in the same database. */
let ready: Promise<unknown> | null = null;
export const ensureAdImageTable = () => (ready ??= db().execute(sql`create table if not exists job_images (
  job_id integer primary key references jobs(id) on delete cascade,
  mime text not null, data bytea not null, created_at timestamptz not null default now())`));

/** Makes a newspaper ad crop easier to read: small crops are enlarged (lanczos), then contrast is stretched and the text sharpened. */
export async function enhance(input: Buffer): Promise<Buffer> {
  const m = await sharp(input, { failOn: "none" }).rotate().metadata();
  const w = m.width ?? 0; const target = w < 1400 ? Math.min(1600, w * 2) : 1600;
  return sharp(input, { failOn: "none" }).rotate()
    .resize({ width: target, kernel: "lanczos3", withoutEnlargement: false })
    .normalise({ lower: 1, upper: 99 })
    .sharpen({ sigma: 1.1, m1: 0.6, m2: 2.2 })
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
}
export async function shrink(file: File): Promise<Buffer> { return enhance(Buffer.from(await file.arrayBuffer())); }
export async function saveAdImage(jobId: number, file: File) {
  await ensureAdImageTable();
  const buf = await shrink(file);
  await db().execute(sql`insert into job_images (job_id, mime, data) values (${jobId}, 'image/jpeg', ${buf}) on conflict (job_id) do update set data = excluded.data, created_at = now()`);
}
export async function hasAdImage(slug: string): Promise<boolean> {
  await ensureAdImageTable();
  const r = await db().execute(sql`select 1 as x from job_images i join jobs j on j.id = i.job_id where j.slug = ${slug} limit 1`);
  return ((r as { rows?: unknown[] }).rows ?? (r as unknown as unknown[])).length > 0;
}
/** For pictures already cropped and shrunk by the newspaper worker. */
export async function saveAdBuffer(jobId: number, buf: Buffer) {
  await ensureAdImageTable();
  const better = await enhance(buf);
  await db().execute(sql`insert into job_images (job_id, mime, data) values (${jobId}, 'image/jpeg', ${better}) on conflict (job_id) do nothing`);
}
/** Re-runs enhance() on every stored ad picture (one-time clean-up for pictures saved before enhancing existed). */
export async function enhanceAll(): Promise<number> {
  await ensureAdImageTable();
  const r = await db().execute(sql`select job_id, encode(data, 'base64') as b64 from job_images`);
  const list = ((r as { rows?: unknown[] }).rows ?? (r as unknown as unknown[])) as { job_id: number; b64: string }[];
  for (const x of list) { const buf = await enhance(Buffer.from(x.b64, "base64")); await db().execute(sql`update job_images set data = ${buf} where job_id = ${x.job_id}`); }
  return list.length;
}

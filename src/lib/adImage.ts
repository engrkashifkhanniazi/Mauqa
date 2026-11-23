import { sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";

/** Ad pictures are added by hand by the admin (newspapers that no robot reads). Stored small, in the same database. */
let ready: Promise<unknown> | null = null;
export const ensureAdImageTable = () => (ready ??= db().execute(sql`create table if not exists job_images (
  job_id integer primary key references jobs(id) on delete cascade,
  mime text not null, data bytea not null, created_at timestamptz not null default now())`));

export async function shrink(file: File): Promise<Buffer> {
  return sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none" }).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}
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
  await db().execute(sql`insert into job_images (job_id, mime, data) values (${jobId}, 'image/jpeg', ${buf}) on conflict (job_id) do nothing`);
}

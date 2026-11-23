import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
/** Short-lived code that lets an e-paper tab (another site, so no admin cookie) send a cropped ad picture to /api/admin/attach. Made only by a signed-in admin; expires after 20 minutes. */
let ready: Promise<unknown> | null = null;
const ensure = () => (ready ??= db().execute(sql`create table if not exists upload_codes (code text primary key, expires_at timestamptz not null)`));
export async function newUploadCode() { await ensure(); const code = randomBytes(18).toString("base64url"); await db().execute(sql`insert into upload_codes (code, expires_at) values (${code}, now() + interval '20 minutes')`); await db().execute(sql`delete from upload_codes where expires_at < now()`); return code; }
export async function uploadCodeOk(code: string) { if (!code || code.length < 20) return false; await ensure(); const r = await db().execute(sql`select 1 as x from upload_codes where code = ${code} and expires_at > now()`); return (((r as { rows?: unknown[] }).rows ?? (r as unknown as unknown[])).length) > 0; }

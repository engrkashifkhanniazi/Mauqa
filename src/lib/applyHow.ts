import { sql } from "drizzle-orm";
import { db } from "@/db";
/** "How to apply" copied by the admin from the advertisement itself. The column is created on first use (also in drizzle/0005). */
let ready: Promise<unknown> | null = null;
export const ensureApplyHow = () => (ready ??= db().execute(sql`alter table jobs add column if not exists apply_how text`).catch((e) => { ready = null; throw e; }));

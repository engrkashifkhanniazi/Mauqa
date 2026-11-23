import { sql } from "drizzle-orm";
import { db } from "@/db";
/** Messages from the Contact page form. Table is created on first use. */
let ready: Promise<unknown> | null = null;
export const ensureContact = () => (ready ??= db().execute(sql`create table if not exists contact_messages (id serial primary key, name text, email text not null, topic text, page_url text, message text not null, created_at timestamptz not null default now())`).catch((e) => { ready = null; throw e; }));

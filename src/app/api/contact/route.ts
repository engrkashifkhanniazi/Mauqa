import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb } from "@/db";
import { ensureContact } from "@/lib/contact";
const Body = z.object({ name: z.string().trim().max(100).optional(), email: z.string().trim().email().max(200), topic: z.enum(["correction", "missing", "alerts", "other"]).default("other"),
  pageUrl: z.string().trim().max(400).optional(), message: z.string().trim().min(10).max(3000), website: z.string().max(0).optional() });
const hits = new Map<string, number[]>();
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"; const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3600e3); if (recent.length >= 5) return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  hits.set(ip, [...recent, now]);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please enter a valid email and a message of at least 10 characters." }, { status: 400 });
  if (!hasDb()) return NextResponse.json({ error: "Messages are not available yet." }, { status: 503 });
  const b = p.data; await ensureContact();
  await db().execute(sql`insert into contact_messages (name, email, topic, page_url, message) values (${b.name ?? null}, ${b.email.toLowerCase()}, ${b.topic}, ${b.pageUrl ?? null}, ${b.message})`);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb } from "@/db";
import { sendMail, confirmUrl, unsubUrl, mailConfigured } from "@/lib/mail";
const Body = z.object({ email: z.string().email().max(200), query: z.object({ q: z.string().max(100).optional(), province: z.string().max(40).optional(), edu: z.string().max(20).optional(), bps: z.string().max(10).optional() }).default({}) });
const hits = new Map<string, number[]>();
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"; const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3600e3); if (recent.length >= 5) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  hits.set(ip, [...recent, now]);
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (!hasDb()) return NextResponse.json({ error: "Alerts are not available yet." }, { status: 503 });
  const email = p.data.email.toLowerCase();
  const c = await db().execute(sql`select count(*)::int as n from alerts where email = ${email} and created_at > now() - interval '1 hour'`);
  if (Number(((c.rows ?? c) as { n: number }[])[0]?.n) >= 3) return NextResponse.json({ error: "Too many requests for this email." }, { status: 429 });
  const token = randomBytes(24).toString("base64url");
  await db().execute(sql`insert into alerts (email, query_json, token) values (${email}, ${JSON.stringify(p.data.query)}::jsonb, ${token})`);
  const sent = await sendMail(email, "Confirm your Mauqa job alert", `<p>Confirm your job alert: <a href="${confirmUrl(token)}">Confirm</a></p><p><a href="${unsubUrl(token)}">Unsubscribe</a></p>`);
  return NextResponse.json({ ok: true, emailSent: sent, note: mailConfigured() ? undefined : "Email delivery is not configured yet; confirmation was not sent." });
}

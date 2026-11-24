import Anthropic from "@anthropic-ai/sdk";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { costUsd, withinBudget } from "./budget";
import { sha256 } from "@/lib/fetcher";

export const AdSchema = z.object({ title: z.string().nullable(), department: z.string().nullable(), vacancies: z.number().int().nullable(), bps: z.number().int().min(1).max(22).nullable(),
  education: z.string().nullable(), age_min: z.number().int().nullable(), age_max: z.number().int().nullable(), city: z.string().nullable(), province: z.string().nullable(), last_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  is_recruitment_ad: z.boolean(), confidence: z.number().min(0).max(1) });
export type AdFacts = z.infer<typeof AdSchema>;
const PROMPT = `Extract structured facts from this Pakistani government job advertisement image. Return ONLY JSON with keys: title, department, vacancies (total posts, integer), bps (integer 1-22), education, age_min, age_max, city, province, last_date (YYYY-MM-DD), is_recruitment_ad (false for results/admit cards/notices and for admissions, scholarships, entrance or aptitude tests), confidence (0-1). Use null for anything not printed in the ad. Do not guess. Do not copy full ad text.`;
const MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"] as const;
const mediaType = (u: string) => (/\.png/i.test(u) ? "image/png" : /\.webp/i.test(u) ? "image/webp" : "image/jpeg");

async function spentThisMonth() { const r = await db().execute(sql`select coalesce(sum(cost_usd),0)::float as s from ai_calls where created_at >= date_trunc('month', now())`); return Number(((r.rows ?? r) as { s: number }[])[0]?.s ?? 0); }

/** Returns cached facts by content hash, or calls Claude (Haiku first, Sonnet only on low confidence / invalid output). Respects the monthly cap. */
export async function extractFromImage(bytes: Uint8Array, url: string): Promise<{ facts: AdFacts; model: string; cached: boolean } | { skipped: string }> {
  const hash = sha256(bytes);
  const c = await db().execute(sql`select result_json, model from ai_cache where content_hash = ${hash}`);
  const hit = ((c.rows ?? c) as { result_json: unknown; model: string }[])[0];
  if (hit) return { facts: AdSchema.parse(hit.result_json), model: hit.model, cached: true };
  if (!process.env.ANTHROPIC_API_KEY) return { skipped: "ANTHROPIC_API_KEY not set" };
  const client = new Anthropic(); const data = Buffer.from(bytes).toString("base64"); let best: { facts: AdFacts; model: string } | null = null;
  for (const model of MODELS) {
    if (!withinBudget(await spentThisMonth(), undefined, 0.02)) return { skipped: "monthly budget reached" };
    const res = await client.messages.create({ model, max_tokens: 800, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType(url), data } }, { type: "text", text: PROMPT }] }] });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const cost = costUsd(model, res.usage.input_tokens, res.usage.output_tokens); let parsed: AdFacts | null = null;
    try { parsed = AdSchema.parse(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1))); } catch { parsed = null; }
    await db().execute(sql`insert into ai_calls (content_hash, model, tokens_in, tokens_out, cost_usd, ok) values (${hash}, ${model}, ${res.usage.input_tokens}, ${res.usage.output_tokens}, ${cost}, ${!!parsed})`);
    if (parsed) { best = { facts: parsed, model }; if (parsed.confidence >= 0.85) break; }
  }
  if (!best) return { skipped: "model output failed validation" };
  const last = await db().execute(sql`select tokens_in, tokens_out, cost_usd from ai_calls where content_hash = ${hash} order by id desc limit 1`);
  const l = ((last.rows ?? last) as { tokens_in: number; tokens_out: number; cost_usd: number }[])[0];
  await db().execute(sql`insert into ai_cache (content_hash, model, result_json, tokens_in, tokens_out, cost_usd) values (${hash}, ${best.model}, ${JSON.stringify(best.facts)}::jsonb, ${l.tokens_in}, ${l.tokens_out}, ${l.cost_usd}) on conflict do nothing`);
  return { ...best, cached: false };
}

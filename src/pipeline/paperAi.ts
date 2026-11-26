import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { costUsd } from "./budget";
import { sha256 } from "@/lib/fetcher";
import { cropAd } from "./adCrop";
import { jsonArrayLoose } from "./jsonLoose";
export { jsonArrayLoose };

/** Default monthly cap (USD) used when CLAUDE_MONTHLY_BUDGET_USD is not set, so pasting only the API key is safe. */
export const DEFAULT_CAP = 8;
const MODEL = "claude-haiku-5-5";
const cap = () => Number(process.env.CLAUDE_MONTHLY_BUDGET_USD || DEFAULT_CAP);
type R = Record<string, unknown>;
const rows = (r: unknown) => ((r as { rows?: R[] }).rows ?? r) as R[];
export class BudgetStop extends Error {}

async function spent() { return Number(rows(await db().execute(sql`select coalesce(sum(cost_usd),0)::float as s from ai_calls where created_at >= date_trunc('month', now())`))[0]?.s ?? 0); }

export const PaperAd = z.object({
  title: z.string().min(3), department: z.string().nullable(), vacancies: z.number().int().nullable(), bps: z.number().int().min(1).max(22).nullable(),
  education: z.string().nullable(), city: z.string().nullable(), province: z.string().nullable(),
  last_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), is_government_recruitment: z.boolean(), confidence: z.number().min(0).max(1),
  box: z.array(z.number().min(0).max(1)).length(4).nullable().optional(),
});
export type PaperAdT = z.infer<typeof PaperAd>;
/** An extracted ad, plus the picture of that ad cut from the page (only when the box looked trustworthy). */
export type PaperAdWithCrop = PaperAdT & { crop?: Buffer };

async function ask(img: Buffer, prompt: string, maxTokens: number): Promise<string> {
  if (!(await spent() + 0.01 < cap())) throw new BudgetStop("monthly AI cap reached");
  const client = new Anthropic();
  const res = await client.messages.create({ model: MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: img.toString("base64") } }, { type: "text", text: prompt }] }] });
  const cost = costUsd(MODEL, res.usage.input_tokens, res.usage.output_tokens);
  await db().execute(sql`insert into ai_calls (content_hash, model, tokens_in, tokens_out, cost_usd, ok) values (${sha256(img)}, ${MODEL}, ${res.usage.input_tokens}, ${res.usage.output_tokens}, ${cost}, true)`);
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}
const json = (t: string, open: string, close: string) => { const a = t.indexOf(open), b = t.lastIndexOf(close); return a >= 0 && b > a ? JSON.parse(t.slice(a, b + 1)) : null; };

/** Cheap first pass: does the page carry any recruitment advertisement at all?
 *  The page is checked as a top half and a bottom half at full resolution (a whole page would be shrunk by the API until small
 *  Urdu print is unreadable, which made this check answer "no" for whole editions). Any doubt counts as "yes": a missed ad costs more than one extra read. */
export async function pageHasJobAds(page: Buffer): Promise<boolean> {
  const meta = await sharp(page, { failOn: "none" }).metadata(); const W = meta.width ?? 0, H = meta.height ?? 0;
  if (!W || !H) return true;
  const half = Math.ceil(H * 0.55);
  for (const top of [0, H - half]) {
    const part = await sharp(page, { failOn: "none" }).extract({ left: 0, top, width: W, height: half }).resize({ width: 1500, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
    const t = await ask(part, 'This is half of a Pakistani (Urdu or English) newspaper page. Is there ANY job / recruitment / vacancy advertisement on it (for example words like "اسامیاں", "ملازمت", "ضرورت", "بھرتی", "Career Opportunity", "Jobs", "Vacancies", "Situation Vacant", posts with BPS or a last date to apply), from any employer? Answer ONLY JSON: {"has_job_ads": true|false}', 60);
    let v: unknown = null; try { v = json(t, "{", "}")?.has_job_ads; } catch { v = null; }
    if (v !== false) return true;
  }
  return false;
}

const PROMPT = `This is one part of a Pakistani newspaper page. List every GOVERNMENT or public-sector recruitment advertisement visible in it (ignore results, admit cards, tenders, private companies, matrimonial and other ads).
Return ONLY a JSON array. Each item: {"title": post/project name in English, "department": hiring organisation in English, "vacancies": total posts integer or null, "bps": integer 1-22 or null, "education": minimum qualification in short English or null, "city": string or null, "province": string or null, "last_date": "YYYY-MM-DD" or null, "is_government_recruitment": true, "confidence": 0-1, "box": [left, top, right, bottom]}.
"box" is the rectangle around the WHOLE advertisement as fractions 0 to 1 of this part (left and top first). Use null if you cannot place it exactly.
Write facts in your own short words. Use null for anything not printed. Never guess a date. If an ad is cut off at the edge of this part, skip it. If there are none, return [].`;

/** 2x2 overlapping tiles keep fine print readable. Facts are extracted; a cropped picture of each ad is kept only when its box is trustworthy. */
export async function extractPageAds(page: Buffer): Promise<PaperAdWithCrop[]> {
  const meta = await sharp(page, { failOn: "none" }).metadata(); const W = meta.width ?? 0, H = meta.height ?? 0;
  if (!W || !H) return [];
  const tw = Math.round(W * 0.56), th = Math.round(H * 0.56); const out: PaperAdWithCrop[] = [];
  for (const [x, y] of [[0, 0], [W - tw, 0], [0, H - th], [W - tw, H - th]]) {
    const tile = await sharp(page, { failOn: "none" }).extract({ left: x, top: y, width: tw, height: th }).resize({ width: 1800, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
    try {
      const arr = json(await ask(tile, PROMPT, 1500), "[", "]");
      if (Array.isArray(arr)) for (const a of arr) { const p = PaperAd.safeParse(a); if (p.success && p.data.is_government_recruitment) out.push({ ...p.data, crop: p.data.confidence >= 0.7 ? await cropAd(page, { x, y, w: tw, h: th }, p.data.box).catch(() => undefined) : undefined }); }
    } catch (e) { if (e instanceof BudgetStop) throw e; }
  }
  return out;
}

const PDF_PROMPT = `This PDF is a Pakistani government recruitment advertisement (it may be a scan). List EVERY post advertised in it.
Return ONLY a JSON array. Each item: {"title": post name in English, "department": hiring department/organisation in English, "vacancies": number of posts for that item or null, "bps": integer 1-22 or null, "education": minimum qualification in short English or null, "city": string or null, "province": string or null, "last_date": "YYYY-MM-DD" last date to apply or null, "is_government_recruitment": true, "confidence": 0-1}.
Write facts in your own short words, do not copy paragraphs. Use null when not printed. Never guess a date. If it is not a recruitment ad, return [].`;

/** Reads a recruitment-ad PDF with Claude (PDF input). Returns facts only; the PDF is not stored. */
export async function extractPdfPosts(pdf: Uint8Array): Promise<PaperAdT[]> {
  if (pdf.length > 20 * 1024 * 1024) return [];
  if (!(await spent() + 0.05 < cap())) throw new BudgetStop("monthly AI cap reached");
  const client = new Anthropic();
  const res = await client.messages.create({ model: MODEL, max_tokens: 16000, messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: Buffer.from(pdf).toString("base64") } }, { type: "text", text: PDF_PROMPT }] }] });
  const cost = costUsd(MODEL, res.usage.input_tokens, res.usage.output_tokens);
  await db().execute(sql`insert into ai_calls (content_hash, model, tokens_in, tokens_out, cost_usd, ok) values (${sha256(pdf)}, ${MODEL}, ${res.usage.input_tokens}, ${res.usage.output_tokens}, ${cost}, true)`);
  const arr = jsonArrayLoose(res.content.map((b) => (b.type === "text" ? b.text : "")).join(""));
  const out: PaperAdT[] = [];
  if (Array.isArray(arr)) for (const a of arr) { const p = PaperAd.safeParse(a); if (p.success && p.data.is_government_recruitment) out.push(p.data); }
  return out;
}

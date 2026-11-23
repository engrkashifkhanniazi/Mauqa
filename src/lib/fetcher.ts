import { createHash } from "node:crypto";
export const UA = "RozgarDeskBot/1.0 (+https://github.com/engrkashifkhanniazi/rozgardesk; job-listing aggregator, links to official sources)";
const lastHit = new Map<string, number>();
const robotsCache = new Map<string, string[] | null>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const sha256 = (b: string | Uint8Array) => createHash("sha256").update(b).digest("hex");

/** Throttle to at most 1 request per second per host. */
async function throttle(host: string) {
  const wait = (lastHit.get(host) ?? 0) + 1000 - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
}
export function parseRobots(txt: string): string[] {
  const dis: string[] = []; let applies = false;
  for (const raw of txt.split(/\r?\n/)) {
    const l = raw.replace(/#.*/, "").trim(); if (!l) continue;
    const [k, ...v] = l.split(":"); const key = k.toLowerCase(); const val = v.join(":").trim();
    if (key === "user-agent") applies = val === "*" || /rozgardeskbot/i.test(val);
    else if (applies && key === "disallow" && val) dis.push(val);
  }
  return dis;
}
export async function robotsAllows(url: string): Promise<boolean> {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    try { await throttle(u.host); const r = await fetch(u.origin + "/robots.txt", { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15000) });
      robotsCache.set(u.origin, r.ok ? parseRobots(await r.text()) : null); } catch { robotsCache.set(u.origin, null); }
  }
  const rules = robotsCache.get(u.origin); // unreadable robots.txt => no rules to honour (documented assumption)
  return !rules || !rules.some((p) => u.pathname.startsWith(p));
}
export interface FetchResult { status: number; notModified: boolean; body?: Uint8Array; text?: string; etag?: string | null; hash?: string; contentType?: string | null; setCookie?: string | null }
export async function politeFetch(url: string, opts: { etag?: string | null; binary?: boolean; referer?: string; form?: Record<string, string>; cookie?: string } = {}): Promise<FetchResult> {
  if (!(await robotsAllows(url))) throw new Error(`robots.txt disallows ${url}`);
  const host = new URL(url).host; let delay = 2000;
  for (let attempt = 0; attempt < 3; attempt++) {
    await throttle(host);
    try {
      const r = await fetch(url, { method: opts.form ? "POST" : "GET", ...(opts.form ? { body: new URLSearchParams(opts.form) } : {}), headers: { "user-agent": UA, ...(opts.referer ? { referer: opts.referer } : {}), ...(opts.cookie ? { cookie: opts.cookie } : {}), ...(opts.etag ? { "if-none-match": opts.etag } : {}) }, signal: AbortSignal.timeout(30000), redirect: "follow" });
      if (r.status === 304) return { status: 304, notModified: true };
      if (r.status === 429 || r.status >= 500) { await sleep(delay); delay *= 2; continue; }
      if (r.status === 401 || r.status === 403) throw new Error(`access refused (${r.status}); not bypassing`);
      const buf = new Uint8Array(await r.arrayBuffer());
      return { status: r.status, notModified: false, body: buf, text: opts.binary ? undefined : new TextDecoder().decode(buf), etag: r.headers.get("etag"), hash: sha256(buf), contentType: r.headers.get("content-type"), setCookie: r.headers.get("set-cookie") };
    } catch (e) { if (attempt === 2) { const c = (e as { cause?: { code?: string; message?: string } }).cause; throw new Error(`${(e as Error).message}${c ? ` [cause: ${c.code ?? ''} ${c.message ?? ''}]` : ''}`); } await sleep(delay); delay *= 2; }
  }
  throw new Error(`gave up on ${url}`);
}

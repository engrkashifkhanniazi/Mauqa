/** Turns text that a human copied from an official page into candidate listings.
 *  One candidate per line that contains a recognisable closing date. Nothing here is "Verified". */
export interface Cand { title: string; lastDate: string; bps?: number; vacancies?: number }
const M: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const iso = (y: number, m: number, d: number) => (y > 2000 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null);
const PATS: { re: RegExp; f: (m: RegExpMatchArray) => string | null }[] = [
  { re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, f: (m) => iso(+m[1], +m[2], +m[3]) },
  { re: /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/, f: (m) => iso(+m[3], +m[2], +m[1]) },
  { re: /\b(\d{1,2})(?:st|nd|rd|th)?[ -]([A-Za-z]{3})[a-z]*[ ,.-]+(\d{4})\b/, f: (m) => iso(+m[3], M[m[2].toLowerCase()] ?? 0, +m[1]) },
  { re: /\b([A-Za-z]{3})[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})\b/, f: (m) => iso(+m[3], M[m[1].toLowerCase()] ?? 0, +m[2]) },
];
export function parsePaste(text: string): Cand[] {
  const out: Cand[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (line.length < 12) continue;
    let hit: { idx: number; len: number; date: string } | null = null;
    for (const p of PATS) { const m = line.match(p.re); if (m && m.index !== undefined) { const d = p.f(m); if (d) { hit = { idx: m.index, len: m[0].length, date: d }; break; } } }
    if (!hit) continue;
    let title = (line.slice(0, hit.idx) + " " + line.slice(hit.idx + hit.len)).replace(/\b(last date|closing date|apply (?:by|before)|deadline|date)\b[:\s-]*/gi, "").replace(/[|:;,\-–]+\s*$/g, "").replace(/^[\s|:;,\-–•\d.)]+/, "").trim();
    const bps = title.match(/\bBPS[- ]?(\d{1,2})\b/i); const vac = title.match(/\b(\d{1,5})\s*(?:vacancies|posts|seats)\b/i);
    if (title.length < 5 || title.length > 200) continue;
    out.push({ title, lastDate: hit.date, bps: bps ? +bps[1] : undefined, vacancies: vac ? +vac[1] : undefined });
  }
  return out;
}

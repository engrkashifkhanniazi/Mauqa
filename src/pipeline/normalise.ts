const MONTHS: Record<string, number> = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12 };
/** "15-December-2026" -> "2026-12-15"; returns null when unparseable. */
export function parseEteaDate(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})[-\s]([A-Za-z]+)[-\s](\d{4})$/);
  if (!m) return null;
  const mo = MONTHS[m[2].toLowerCase()];
  if (!mo) return null;
  return `${m[3]}-${String(mo).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}
export function parseBps(s: string): number | null {
  const m = s.match(/BPS[-\s]*(\d{1,2})/i) ?? s.match(/\b(?:scale|grade)[-\s]*(\d{1,2})\b/i);
  const n = m ? Number(m[1]) : NaN;
  return n >= 1 && n <= 22 ? n : null;
}
const DEPT_ALIASES: Record<string, string> = { "fbr": "Federal Board of Revenue", "c&w": "Communication and Works", "hed": "Higher Education Department" };
export const normaliseDept = (s: string) => DEPT_ALIASES[s.trim().toLowerCase()] ?? s.trim().replace(/\s+/g, " ");
export function slugify(title: string, code: string) {
  const clean = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (clean(title) + "-" + clean(code)).slice(0, 90).replace(/-+$/g, "");
}

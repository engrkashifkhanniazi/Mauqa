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

const SHORT_MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
/** "7th December 2026" / "24 Nov 2026" -> "2026-12-07". Returns null when it is not a clear date. */
export function parseLongDate(s: string): string | null {
  const m = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/);
  if (!m) return null;
  const mo = SHORT_MONTHS[m[2].slice(0, 3).toLowerCase()]; if (!mo) return null;
  const d = Number(m[1]); if (d < 1 || d > 31) return null;
  return `${m[3]}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

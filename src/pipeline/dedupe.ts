export interface DedupeInput { employer?: string|null; title: string; vacancies?: number|null; lastDate?: string|null; location?: string|null; education?: string|null; text?: string|null }
const tok = (s?: string|null) => new Set((s ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean));
export function jaccard(a?: string|null, b?: string|null) {
  const A = tok(a), B = tok(b); if (!A.size && !B.size) return 0; let i = 0; A.forEach((x) => B.has(x) && i++); return i / (A.size + B.size - i);
}
const eq = (a: unknown, b: unknown) => (a != null && a === b ? 1 : 0);
export function dedupeScore(a: DedupeInput, b: DedupeInput) {
  return 0.25 * jaccard(a.employer, b.employer) + 0.25 * jaccard(a.title, b.title) + 0.15 * eq(a.vacancies, b.vacancies)
    + 0.15 * eq(a.lastDate, b.lastDate) + 0.10 * jaccard(a.location, b.location) + 0.05 * jaccard(a.education, b.education) + 0.05 * jaccard(a.text, b.text);
}
export const classify = (s: number) => (s >= 0.9 ? "auto-link" : s >= 0.7 ? "review" : "distinct") as "auto-link" | "review" | "distinct";

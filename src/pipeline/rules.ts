import { checkScope } from "./scope";
import { isAdmission } from "../lib/normalize";
export interface Candidate {
  title?: string | null; officialUrl?: string | null; lastDate?: string | null; noDeadlineStated?: boolean;
  regionText?: string; aiUsed?: boolean; ocrConflict?: boolean; aiConfidence?: number | null; conflictsWithExisting?: boolean; fieldsConfirmedAgainstSource?: boolean;
}
export type Decision = { action: "publish" | "quarantine" | "reject"; verified: boolean; reasons: string[] };
export const ALLOWED_DOMAINS = ["etea.online", "kppsc.gov.pk", "fpsc.gov.pk", "mashriqtv.pk", "e.jang.com.pk", "nawaiwaqt.com.pk", "epaper.dailyaaj.com.pk", "dailyausaf.com", "express.com.pk", "etea.edu.pk", "nts.org.pk", "ots.org.pk", "pts.org.pk", "njp.gov.pk"];
const NON_JOB = /\b(result|admit card|roll no|interview schedule|answer key|date sheet|merit list|notice of|corrigendum only)\b/i;

export function hostAllowed(url: string, allowed = ALLOWED_DOMAINS) {
  try { const h = new URL(url).hostname.toLowerCase(); return allowed.some((d) => h === d || h.endsWith("." + d)); } catch { return false; }
}
/** Deterministic gate: the only code path that can publish a job. */
export function evaluate(c: Candidate, today = new Date()): Decision {
  const reasons: string[] = [];
  if (c.title && NON_JOB.test(c.title)) return { action: "reject", verified: false, reasons: ["non-job notice"] };
  // Owner decision 24 Nov 2026: no scholarships, admissions or entrance/aptitude-test notices at all.
  if (c.title && isAdmission(c.title)) return { action: "reject", verified: false, reasons: ["admission / scholarship / test notice (not a job)"] };
  if (c.regionText !== undefined) { const sc = checkScope(c.title, c.regionText); if (!sc.inScope) return { action: "reject", verified: false, reasons: [sc.reason] }; }
  if (!c.title?.trim()) reasons.push("missing title");
  if (!c.officialUrl) reasons.push("missing source url");
  else if (!hostAllowed(c.officialUrl)) reasons.push("source url not on allowed domain");
  if (!c.lastDate && !c.noDeadlineStated) reasons.push("missing deadline");
  if (c.lastDate) {
    const d = new Date(c.lastDate + "T23:59:59");
    if (isNaN(d.getTime())) reasons.push("invalid deadline");
    else if (d < today) reasons.push("deadline in the past");
  }
  if (c.aiUsed && !((c.aiConfidence ?? 0) >= 0.85)) reasons.push("ai confidence below 0.85");
  if (c.ocrConflict) reasons.push("scanned-PDF date disagrees with the ad's closing date");
  if (c.conflictsWithExisting) reasons.push("conflicts with existing listing");
  if (reasons.length) return { action: "quarantine", verified: false, reasons };
  // Verified only when fields were checked against the official source by code, never for AI-only reads.
  return { action: "publish", verified: !!c.fieldsConfirmedAgainstSource && !c.aiUsed, reasons: [] };
}

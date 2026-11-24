import { timingSafeEqual, createHash } from "node:crypto";

/** Sources the laptop (Claude in Chrome) runs may post for. */
export const INTAKE_SOURCES = ["ETEA", "OTS", "PTS", "NJP", "KPPSC", "FPSC", "NTS", "ATS", "Nawa-i-Waqt", "Daily Ausaf", "Daily Mashriq", "Daily Jang", "Daily Express", "Daily Aaj"];

/** Constant-time check of the intake token (env INTAKE_TOKEN, at least 24 characters). */
export function intakeTokenOk(given: string | null | undefined, expected = process.env.INTAKE_TOKEN ?? ""): boolean {
  if (!expected || expected.length < 24 || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Same ad seen in two editions (Ausaf Islamabad + Peshawar) or already added by a worker → same key. */
export function sameAdKey(title: string, lastDate: string, department?: string | null): string {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();
  return createHash("sha256").update(`${n(title)}|${n(department ?? "")}|${lastDate}`).digest("hex").slice(0, 16);
}

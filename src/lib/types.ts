export type SourceKey = "FPSC" | "KPPSC" | "ETEA" | "PPSC" | "SPSC" | "BPSC" | "NTS" | "OTS" | "PTS" | "ATS" | "NJP" | "Daily Aaj" | "Daily Jang" | "Nawa-i-Waqt" | "Daily Mashriq" | "Daily Ausaf" | "Daily Express";
export interface JobView {
  id: number; slug: string; title: string; department: string; source: SourceKey;
  province: string; city: string; bps: number | null; vacancies: number | null;
  lastDate: string; education: string; age: string; verified: boolean; officialUrl: string;
  /** ISO date the listing was added to the site (for the New badge). */
  added?: string;
}
export const GOV: SourceKey[] = ["FPSC", "KPPSC", "ETEA", "PPSC", "SPSC", "BPSC", "NTS", "OTS", "PTS", "ATS", "NJP"];
export const isGov = (s: string) => (GOV as string[]).includes(s);
export const ALL_SOURCES: SourceKey[] = ["FPSC", "KPPSC", "ETEA", "PPSC", "SPSC", "BPSC", "NTS", "OTS", "PTS", "ATS", "NJP", "Daily Aaj", "Daily Jang", "Nawa-i-Waqt", "Daily Mashriq", "Daily Ausaf", "Daily Express"];

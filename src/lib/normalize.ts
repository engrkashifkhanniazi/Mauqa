import type { JobView } from "./types";
/** Display-time clean-up of listing data (province, city, title) plus simple classifications used by filters. */
export const KP = "Khyber Pakhtunkhwa", FED = "Islamabad / Federal", OTHER = "Nationwide / Other";
const KP_PLACES = /\b(peshawar|mardan|swat|mingora|abbottabad|nowshera|charsadda|kohat|bannu|d\.?\s?i\.?\s?khan|dera ismail khan|karak|lakki marwat|tank|chitral|dir|malakand|batkhela|timergara|buner|shangla|swabi|haripur|mansehra|battagram|kohistan|torghar|hangu|khyber|kurram|orakzai|bajaur|mohmand|waziristan|pakhtunkhwa|kpk?)\b/i;
const FED_PLACES = /\b(islamabad|rawalpindi|federal|ict)\b/i;
const OTHER_PLACES = /\b(punjab|lahore|faisalabad|multan|sindh|karachi|hyderabad|balochistan|quetta|gilgit|baltistan|azad kashmir|ajk|muzaffarabad)\b/i;
const KP_SOURCES = ["ETEA", "KPPSC", "Daily Aaj", "Daily Mashriq"];
const FED_SOURCES = ["FPSC", "NJP", "OTS", "Nawa-i-Waqt", "Daily Ausaf"];
export function normProvince(province: string, city: string, department: string, source: string): string {
  const p = province.trim();
  if (/khyber|pakhtunkhwa|\bkpk?\b/i.test(p)) return KP;
  if (/federal|islamabad/i.test(p)) return FED;
  if (p && OTHER_PLACES.test(p)) return OTHER;
  const place = `${city} ${department}`;
  if (KP_PLACES.test(place)) return KP;
  if (FED_PLACES.test(place)) return FED;
  if (OTHER_PLACES.test(place)) return OTHER;
  if (KP_SOURCES.includes(source)) return KP;
  if (FED_SOURCES.includes(source)) return FED;
  return OTHER;
}
const CITY_FIX: [RegExp, string][] = [[/^dir upper$/i, "Upper Dir"], [/^upper dir$/i, "Upper Dir"], [/^dir lower$/i, "Lower Dir"], [/^lower dir$/i, "Lower Dir"],
  [/^(d\.?\s?i\.?\s?khan|dera ismail khan)$/i, "D.I. Khan"], [/^kohistan lower$/i, "Lower Kohistan"], [/^kohistan upper$/i, "Upper Kohistan"], [/^abbotabad$/i, "Abbottabad"]];
export function normCity(city: string): string {
  const c = city.replace(/\s+/g, " ").trim(); if (!c) return "";
  for (const [re, v] of CITY_FIX) if (re.test(c)) return v;
  return c.replace(/\b\w/g, (m) => m.toUpperCase());
}
export function cleanTitle(t: string): string {
  let s = t.replace(/\s+/g, " ").trim();
  while (s.startsWith("(") && s.endsWith(")")) { const inner = s.slice(1, -1); let depth = 0, ok = true; for (const ch of inner) { if (ch === "(") depth++; else if (ch === ")" && --depth < 0) { ok = false; break; } } if (!ok || depth) break; s = inner.trim(); }
  return s;
}
/** Admission, aptitude-test and scholarship notices are not jobs; they are hidden from the job list by default. */
export const isAdmission = (title: string) => /\b(admissions?|degree program(me)?|entrance test|aptitude test|nat-?\s?[ivx]+|national aptitude|gat\b|graduate assessment test|toeic|test of english|scholarships?)\b/i.test(title);
export type Kind = "portal" | "testing" | "paper";
export const sourceKind = (s: string): Kind => ["ETEA", "NTS", "OTS", "PTS", "ATS"].includes(s) ? "testing" : ["FPSC", "KPPSC", "PPSC", "SPSC", "BPSC", "NJP"].includes(s) ? "portal" : "paper";
export const KIND_LABEL: Record<Kind, { en: string; ur: string }> = { portal: { en: "Official portal", ur: "سرکاری پورٹل" }, testing: { en: "Testing agency", ur: "ٹیسٹنگ ادارہ" }, paper: { en: "Newspaper ad", ur: "اخباری اشتہار" } };
export type Edu = "" | "matric" | "inter" | "bachelor" | "master" | "medical";
export function eduLevel(e: string): Edu {
  const s = e.toLowerCase(); if (!s.trim()) return "";
  if (/mbbs|bds|fcps|nursing|pharm|\bdpt\b|dvm|medical|dental|\bmd\b|lhv|midwi/.test(s)) return "medical";
  if (/master|m\.?\s?phil|ph\.?\s?d|\bm\.?\s?sc\b|\bmsc\b|\bm\.?a\b|\bmba\b|\bms\b|\bllm\b|18 years/.test(s)) return "master";
  if (/bachelor|\bb\.?\s?a\b|\bb\.?\s?sc\b|\bbsc\b|\bbs\b|graduat|14 years|16 years|\bb\.?e\b|\bbba\b|b\.?\s?com|\bllb\b|\bca\b|acca|degree/.test(s)) return "bachelor";
  if (/intermediate|\bf\.?\s?a\b|\bf\.?\s?sc\b|\bfsc\b|hssc|\bdae\b|diploma|12th|\bics\b|i\.com/.test(s)) return "inter";
  if (/matric|\bssc\b|middle|primary|literate|8th|10th|\bsecondary/.test(s)) return "matric";
  return "";
}
export function normJob<T extends JobView>(j: T): T & { admission: boolean } {
  const city = normCity(j.city);
  return { ...j, title: cleanTitle(j.title), city, province: normProvince(j.province, city, j.department, j.source), admission: isAdmission(j.title) };
}

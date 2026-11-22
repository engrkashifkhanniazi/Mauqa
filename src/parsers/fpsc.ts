import * as cheerio from "cheerio";
import type { ParseResult, ParsedJob, ParsedFile } from "./types";
const BASE = "https://www.fpsc.gov.pk/";
export const FPSC_URL = "https://www.fpsc.gov.pk/Jobs?section=GR";

/** FPSC "Jobs > GR Advertisements" page (server-rendered, mapped from a real capture of 2026-11-22).
 *  Each card = date + title + links. The per-post details (vacancies, BPS, qualification, last date) live
 *  inside the PDF, so this parser only records the advertisement itself: no invented fields, lastDate stays null. */
export function parseFpsc(html: string): ParseResult {
  const $ = cheerio.load(html);
  const h1 = $("h1").filter((_, e) => /advertisements/i.test($(e).text())).first();
  if (!h1.length) return { items: [], emptyState: false, broken: true, note: "FPSC 'Advertisements' heading not found; layout changed?" };
  const cards = h1.parent().find("h2").filter((_, e) => /advertisement/i.test($(e).text()));
  const items: ParsedJob[] = [];
  cards.each((_, h2) => {
    const title = $(h2).text().replace(/\s+/g, " ").trim();
    const root = $(h2).parent();
    const files: ParsedFile[] = []; let applyUrl: string | undefined;
    root.find("a[href]").each((__, a) => {
      const label = ($(a).attr("title") ?? $(a).text()).replace(/\s+/g, " ").trim(); const href = $(a).attr("href") ?? "";
      let url: string; try { url = new URL(href, BASE).toString(); } catch { return; }
      const ctx = $(a).parent().text();
      if (/index_gr|apply online/i.test(href + " " + ctx.slice(-40)) && /index/i.test(href)) { applyUrl = url; files.push({ label: "Apply online", url, kind: "apply" }); }
      else if (/\/uploads\/.*advert|advertisement/i.test(href + " " + label)) files.push({ label: "Advertisement", url, kind: "advertisement" });
    });
    const ad = files.find((f) => f.kind === "advertisement");
    if (!ad) return;
    const no = title.match(/No\.?\s*([\w/.-]+)/i)?.[1] ?? title.slice(0, 40);
    items.push({ sourceKey: "FPSC", externalId: `GR-${no}`, title, lastDate: null, officialUrl: ad.url, applyUrl, files, needsAi: false, fieldsConfirmedAgainstSource: false });
  });
  if (items.length) return { items, emptyState: false, broken: false, note: "advertisement-level only; post details are inside the PDF" };
  if (!cards.length) return { items: [], emptyState: true, broken: false };
  return { items: [], emptyState: false, broken: true, note: "advertisement cards found but no PDF link inside" };
}

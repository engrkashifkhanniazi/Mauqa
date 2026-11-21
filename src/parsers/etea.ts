import * as cheerio from "cheerio";
import { parseEteaDate, slugify } from "../pipeline/normalise";
import type { ParseResult, ParsedJob, ParsedFile } from "./types";
const BASE = "https://etea.online/";
const abs = (h: string) => { try { return new URL(h, BASE).toString(); } catch { return null; } };
const kindOf = (label: string, href: string): ParsedFile["kind"] => /corrigendum/i.test(label + href) ? "corrigendum" : /syllabus/i.test(label) ? "syllabus" : /apply/i.test(href) ? "apply" : "advertisement";

/** Parses the ETEA projects table. Column positions are resolved from the header row, not hardcoded. */
export function parseEtea(html: string): ParseResult {
  const $ = cheerio.load(html); const items: ParsedJob[] = [];
  let sawTable = false;
  $("table").each((_, t) => {
    const heads = $(t).find("thead th, tr:first-child th").map((_, th) => $(th).text().trim().toLowerCase()).get();
    const ix = (re: RegExp) => heads.findIndex((h) => re.test(h));
    const iTitle = ix(/project title|title/), iCode = ix(/code/), iDate = ix(/last date/);
    if (iTitle < 0 || iDate < 0) return;
    sawTable = true;
    $(t).find("tbody tr").each((_, tr) => {
      const td = $(tr).find("td"); if (td.length < heads.length - 1) return;
      const title = $(td[iTitle]).text().trim(); if (!title) return;
      const code = iCode >= 0 ? $(td[iCode]).text().trim() : "";
      const files: ParsedFile[] = [];
      $(tr).find("a[href]").each((_, a) => { const u = abs($(a).attr("href")!); if (!u) return; const label = $(a).text().trim() || "Link"; files.push({ label, url: u, kind: kindOf(label, u) }); });
      const ad = files.find((f) => f.kind === "advertisement");
      const apply = files.find((f) => f.kind === "apply");
      if (!ad) return;
      items.push({ sourceKey: "ETEA", externalId: code || slugify(title, ""), title, lastDate: parseEteaDate($(td[iDate]).text()), officialUrl: ad.url, applyUrl: apply?.url, files,
        needsAi: /\.(jpe?g|png|webp)(\?|$)/i.test(ad.url), fieldsConfirmedAgainstSource: false });
    });
  });
  // A page with no recognisable table is a broken parser, never "no jobs".
  return { items, emptyState: false, broken: !sawTable, note: sawTable ? undefined : "no projects table found" };
}

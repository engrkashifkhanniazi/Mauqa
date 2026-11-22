import * as cheerio from "cheerio";
import { parseLongDate, slugify } from "../pipeline/normalise";
import type { ParseResult, ParsedJob } from "./types";
const BASE = "https://www.nts.org.pk/new/";
const LAST = /Last Date of Application Form Submission is:\s*(.+)/i;

/** NTS "Open Applications" page: each project is a title line followed by "Last Date of Application Form Submission is: <date>" and a Details link. */
export function parseNts(html: string): ParseResult {
  const $ = cheerio.load(html); $("script,style").remove();
  $("br").replaceWith("\n"); $("p,div,li,tr,td,h1,h2,h3,h4,h5,h6").each((_, e) => { $(e).append("\n"); });
  const lines = $("body").text().split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const start = lines.findIndex((l) => /^Closed Applications$/i.test(l));
  const rows: { title: string; date: string | null }[] = [];
  for (let i = Math.max(start, 0) + 1; i < lines.length; i++) {
    const m = lines[i].match(LAST); if (!m) continue;
    const title = lines[i - 1]; if (!title || LAST.test(title)) continue;
    rows.push({ title, date: parseLongDate(m[1]) });
  }
  const details = $("a").filter((_, a) => /^details$/i.test($(a).text().replace(/\s+/g, " ").trim())).map((_, a) => $(a).attr("href") ?? "").get();
  if (!rows.length) return { items: [], emptyState: false, broken: true, note: "no NTS project rows found" };
  const items: ParsedJob[] = rows.map((r, i) => {
    let url = BASE + "projectsnew.php"; try { if (details.length === rows.length && details[i]) url = new URL(details[i], BASE).toString(); } catch { /* keep listing url */ }
    return { sourceKey: "NTS", externalId: slugify(r.title, "").slice(0, 60), title: r.title, lastDate: r.date, officialUrl: url, files: [], needsAi: false, fieldsConfirmedAgainstSource: false };
  });
  return { items, emptyState: false, broken: false };
}

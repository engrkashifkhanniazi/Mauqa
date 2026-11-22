import * as cheerio from "cheerio";
import { parseLongDate } from "../pipeline/normalise";
import type { ParseResult, ParsedJob } from "./types";
const BASE = "https://www.ats.org.pk/";

/** ATS home page "Project" box: links to /details/projects/<id>. The deadline sits on each project page. */
export function parseAtsList(html: string): ParseResult {
  const $ = cheerio.load(html); const items: ParsedJob[] = []; const seen = new Set<string>();
  $("a[href*='/details/projects/']").each((_, a) => {
    const href = $(a).attr("href") ?? ""; let url: string; try { url = new URL(href, BASE).toString(); } catch { return; }
    const title = $(a).text().replace(/\s+/g, " ").trim(); const id = url.split("/").pop() ?? "";
    if (!title || !id || seen.has(id)) return; seen.add(id);
    items.push({ sourceKey: "ATS", externalId: id, title, lastDate: null, officialUrl: url, files: [], needsAi: false, fieldsConfirmedAgainstSource: false, expand: "ats-project" });
  });
  return { items, emptyState: false, broken: items.length === 0, note: items.length ? undefined : "no ATS project links found" };
}
/** "Last Date for submission of Application Forms is 19th November, 2022." */
export function parseAtsProject(html: string): { lastDate: string | null; title: string | null } {
  const $ = cheerio.load(html); $("script,style").remove();
  const text = $("body").text().replace(/\s+/g, " ");
  const m = text.match(/Last Date[^.]{0,80}?\bis\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9},?\s+\d{4})/i);
  const title = $(".alert, h4, h3").map((_, e) => $(e).text().replace(/\s+/g, " ").trim()).get().find((t) => t.length > 8 && !/project details/i.test(t)) ?? null;
  return { lastDate: m ? parseLongDate(m[1]) : null, title };
}

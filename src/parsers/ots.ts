import * as cheerio from "cheerio";
import { parseLongDate, slugify } from "../pipeline/normalise";
import type { ParseResult, ParsedJob } from "./types";
const BASE = "https://www.ots.org.pk/";

/** OTS projects list: one card per project with a "View project" link. Deadlines live on the project page (see parseOtsProject). */
export function parseOtsList(html: string): ParseResult {
  const $ = cheerio.load(html); $("script,style").remove();
  const items: ParsedJob[] = []; const seen = new Set<string>();
  $("a").each((_, a) => {
    if (!/view project/i.test($(a).text())) return;
    const href = $(a).attr("href") ?? ""; let url: string; try { url = new URL(href, BASE).toString(); } catch { return; }
    if (seen.has(url)) return; seen.add(url);
    let card = $(a); for (let i = 0; i < 5; i++) { card = card.parent(); if (/Code:/i.test(card.text()) && card.find("a").filter((_, x) => /view project/i.test($(x).text())).length === 1) break; }
    const parts = card.clone().find("a").remove().end().html()?.split(/<\/?(?:div|p|h\d|span|small|strong)[^>]*>/i).map((t) => cheerio.load(`<i>${t}</i>`)("i").text().replace(/\s+/g, " ").trim()).filter(Boolean) ?? [];
    const title = parts.find((t) => !/^(running|completed)$/i.test(t) && !/^code:|^published/i.test(t) && t.length > 8) ?? "";
    if (!title) return;
    const code = parts.find((t) => /^code:/i.test(t))?.replace(/^code:\s*/i, "").split(/\s+/)[0] ?? slugify(title, "");
    items.push({ sourceKey: "OTS", externalId: code, title, lastDate: null, officialUrl: url, files: [], needsAi: false, fieldsConfirmedAgainstSource: false, expand: "ots-project" });
  });
  return { items, emptyState: false, broken: items.length === 0, note: items.length ? undefined : "no OTS project cards found" };
}

/** OTS project page: each category shows its own title and "Last date 24 Nov 2026". */
export function parseOtsProject(html: string): { title: string; lastDate: string | null }[] {
  const $ = cheerio.load(html); $("script,style").remove();
  $("br").replaceWith("\n"); $("p,div,li,tr,td,h1,h2,h3,h4,h5,h6,span,small,strong,label").each((_, e) => { $(e).append("\n"); });
  const lines = $("body").text().split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const out: { title: string; lastDate: string | null }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^last date$/i.test(lines[i]) || !lines[i + 1]) continue;
    const date = parseLongDate(lines[i + 1]); if (!date) continue;
    // the category title is the nearest preceding line that is not a label or boilerplate
    let t = ""; for (let k = i - 1; k >= Math.max(0, i - 6); k--) { if (!/^(type|recruitment test|open|closed|categories?|opens?)$/i.test(lines[k]) && lines[k].length > 3 && !/invite talented|take the next step/i.test(lines[k])) { t = lines[k]; break; } }
    if (t) out.push({ title: t, lastDate: date });
  }
  return out;
}

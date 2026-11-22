import * as cheerio from "cheerio";
import { parseBps } from "../pipeline/normalise";
import type { ParseResult, ParsedJob } from "./types";
const BASE = "https://www.kppsc.gov.pk/";
const EMPTY = /no active advertisement/i;

/** KPPSC advertisement page. "No active advertisement!" is a legitimate empty state, not a failure. */
export function parseKppsc(html: string): ParseResult {
  const $ = cheerio.load(html); $("script,style,nav").remove();
  const text = $("body").text();
  const links: ParsedJob[] = [];
  $("a[href]").each((_, a) => {
    const label = $(a).text().replace(/\s+/g, " ").trim(); const href = $(a).attr("href") ?? "";
    if (!/advertisement\s*no/i.test(label) || !/\.pdf(\?|$)|download|advert/i.test(href)) return;
    let url: string; try { url = new URL(href, BASE).toString(); } catch { return; }
    const m = label.match(/advertisement\s*no\.?\s*([\w/.-]+)/i);
    links.push({ sourceKey: "KPPSC", externalId: m?.[1] ?? label.slice(0, 40), title: label, bps: parseBps(label), lastDate: null, officialUrl: url,
      files: [{ label: "Advertisement", url, kind: "advertisement" }], needsAi: false, fieldsConfirmedAgainstSource: false, expand: /\.pdf(\?|$)/i.test(url) ? "kppsc-pdf" : undefined });
  });
  if (links.length) return { items: links, emptyState: false, broken: false };
  if (EMPTY.test(text)) return { items: [], emptyState: true, broken: false };
  return { items: [], emptyState: false, broken: true, note: "neither advertisements nor the empty-state message found" };
}

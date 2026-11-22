import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseEtea } from "../src/parsers/etea";
import { parseKppsc } from "../src/parsers/kppsc";
import { parseFpsc } from "../src/parsers/fpsc";
import { parseRobots } from "../src/lib/fetcher";
const fx = (n: string) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), "utf8");
describe("ETEA parser (reconstructed fixture)", () => {
  const r = parseEtea(fx("etea-table.reconstructed.html"));
  it("reads 3 rows with ISO dates and codes", () => { expect(r.items).toHaveLength(3); expect(r.items[0]).toMatchObject({ externalId: "898", lastDate: "2026-12-15", applyUrl: "https://etea.online/apply/" }); });
  it("flags image ads for AI fallback", () => expect(r.items.every((i) => i.needsAi)).toBe(true));
  it("treats a page without the table as broken", () => expect(parseEtea("<html><body>Loading...</body></html>").broken).toBe(true));
});
describe("KPPSC parser", () => {
  it("empty state is legitimate, not broken", () => { const r = parseKppsc(fx("kppsc-empty.reconstructed.html")); expect(r).toMatchObject({ emptyState: true, broken: false, items: [] }); });
  it("unknown layout is broken", () => expect(parseKppsc("<html><body>Maintenance</body></html>").broken).toBe(true));
});
describe("FPSC parser (empty input)", () => it("reports broken, never guesses", () => expect(parseFpsc("").broken).toBe(true)));
describe("robots", () => it("honours Disallow for *", () => expect(parseRobots("User-agent: *\nDisallow: /admin # x\n")).toEqual(["/admin"])));

describe("FPSC parser (real capture, 2026-11-22)", () => {
  const html = readFileSync("tests/fixtures/fpsc-jobs-gr.raw.html", "utf8");
  it("extracts the GR consolidated advertisement with its official PDF", () => {
    const r = parseFpsc(html);
    expect(r.broken).toBe(false);
    expect(r.items).toHaveLength(1);
    expect(r.items[0].title).toMatch(/Consolidated Advertisement No\. 4\/2026/);
    expect(r.items[0].officialUrl).toBe("https://www.fpsc.gov.pk/uploads/content/1793976822925_consolidated-advertisement-04-2026.pdf");
    expect(r.items[0].applyUrl).toBe("https://cp.fpsc.gov.pk/gr_one/index_gr.php");
    expect(r.items[0].lastDate).toBeNull();
    expect(r.items[0].fieldsConfirmedAgainstSource).toBe(false);
  });
  it("reports broken when the layout changes and empty when no cards", () => {
    expect(parseFpsc("<html><body><p>hi</p></body></html>").broken).toBe(true);
    expect(parseFpsc("<h1>GR Advertisements</h1><div><p>none</p></div>").emptyState).toBe(true);
  });
});

import { parseFpscAd } from "../src/parsers/fpscPdf";
describe("FPSC consolidated-ad OCR parser (real OCR text of pages 1-3, 2026-11-22)", () => {
  const ad = parseFpscAd(readFileSync("tests/fixtures/fpsc-ad-ocr-pages1-3.txt", "utf8"));
  it("reads the ad-level dates", () => { expect(ad.publishedDate).toBe("2026-11-06"); expect(ad.closingDate).toBe("2026-11-23"); });
  it("extracts three posts with structured facts", () => {
    expect(ad.posts.map((p) => p.caseNo)).toEqual(["F.4-176/2026-R", "F.4-152/2026-R", "F.4-177/2026-R"]);
    const [a, b, c] = ad.posts;
    expect(a).toMatchObject({ title: "Assistant Draftsman", bps: 18, vacancies: 1, ageMin: 25, ageMax: 35, city: "Islamabad", closingDate: "2026-11-23", dateConflict: false });
    expect(a.department).toBe("Law and Justice");
    expect(b).toMatchObject({ title: "Professor", bps: 20, vacancies: 6, ageMax: 52, city: "Islamabad" });
    expect(c).toMatchObject({ title: "Associate Professor", bps: 19, vacancies: 2, ageMax: 48 });
  });
  it("falls back to the ad-level date when OCR garbles a post's date, without flagging a conflict", () => {
    expect(ad.posts[1].closingDate).toBe("2026-11-23"); expect(ad.posts[1].dateConflict).toBe(false);
  });
  it("flags a real disagreement and returns nothing for empty text", () => {
    const x = parseFpscAd("Islamabad, the 6 November, 2026\n(i) apply on-line upto 23 November, 2026.\n\n1. Case No.F.4-1/2026-R\nPost with pay scale | CLERK (BS-07)\nVacancies One (1)\nClosing date 30-11-2026");
    expect(x.posts[0].dateConflict).toBe(true); expect(parseFpscAd("").posts).toHaveLength(0);
  });
});

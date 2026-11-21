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
describe("FPSC parser", () => it("is explicitly unimplemented", () => expect(parseFpsc("").broken).toBe(true)));
describe("robots", () => it("honours Disallow for *", () => expect(parseRobots("User-agent: *\nDisallow: /admin # x\n")).toEqual(["/admin"])));

import { describe, it, expect } from "vitest";
import { jsonArrayLoose } from "../src/pipeline/jsonLoose";
import { parsePaste } from "../src/lib/pasteParse";
describe("jsonArrayLoose", () => {
  it("reads a normal array", () => { expect(jsonArrayLoose('x [{"a":1},{"a":2}] y')).toHaveLength(2); });
  it("keeps complete items of a cut-off answer", () => {
    const r = jsonArrayLoose('[{"title":"Lecturer {Physics}","n":1},{"title":"Clerk \\"A\\"","n":2},{"title":"Dri');
    expect(r).toEqual([{ title: "Lecturer {Physics}", n: 1 }, { title: 'Clerk "A"', n: 2 }]);
  });
  it("returns [] without an array", () => { expect(jsonArrayLoose("none")).toEqual([]); });
});
describe("KPPSC link title date", () => {
  it("finds the last date in the advertisement title", () => {
    expect(parsePaste("ADVERTISEMENT NO. 10/2026 [Last Date & Time: 17-12-2026 at 05:00 PM]")[0]?.lastDate).toBe("2026-12-17");
  });
});

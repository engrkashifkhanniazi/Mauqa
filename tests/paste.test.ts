import { describe, it, expect } from "vitest";
import { parsePaste } from "../src/lib/pasteParse";
describe("parsePaste", () => {
  it("reads title and date per line", () => {
    const r = parsePaste("Junior Clerk BPS-11 - Last date: 30-12-2026\nrandom heading\n2. Lecturer Physics (BPS-17) 5 posts 5 Jan 2027");
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ lastDate: "2026-12-30", bps: 11 });
    expect(r[1]).toMatchObject({ lastDate: "2027-01-05", bps: 17, vacancies: 5 });
  });
  it("ignores lines without a date", () => { expect(parsePaste("Home | About | Contact us now")).toEqual([]); });
});
describe("structured lines", () => {
  it("reads ;; fields incl. education", () => {
    const r = parsePaste("Staff Nurse;;Services Hospital;;Lahore;;12;;16;;BSc Nursing;;2026-12-20");
    expect(r[0]).toMatchObject({ title: "Staff Nurse", department: "Services Hospital", city: "Lahore", vacancies: 12, bps: 16, education: "BSc Nursing", lastDate: "2026-12-20" });
  });
});

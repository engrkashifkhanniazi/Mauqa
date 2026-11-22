import { describe, it, expect } from "vitest";
import { parseLongDate } from "../src/pipeline/normalise";
import { parseNts } from "../src/parsers/nts";
import { parseOtsList, parseOtsProject } from "../src/parsers/ots";
// Fixtures below are RECONSTRUCTED from the pages' visible text (read in a browser on 2026-11-22), not byte copies of the live HTML.
const NTS = `<html><body><ul><li>Open Applications</li></ul><div>Open Applications</div><div>Closed Applications</div>
<div><p>District & Session Judge, Tando Muhammad Khan (Career Opportunities)</p><p>Last Date of Application Form Submission is:  7th December 2026</p><a href="project.php?id=1">Details</a></div>
<div><p>Khyber Pakhtunkhwa Forest Department</p><p>Last Date of Application Form Submission is:  30th November 2026</p><a href="project.php?id=2">Details</a></div></body></html>`;
const OTS = `<html><body><div class="card"><span>RUNNING</span><h3>Islamabad Capital Territory Police</h3><p>OTS is excited to invite candidates</p><small>Code: ICT2026A</small><small>Published 08 Nov 2026</small><a href="project-view.php?pview=11">View project →</a></div></body></html>`;
const OTSP = `<html><body><h2>Choose the correct category</h2><div><h4>Assistant Manager / Junior Engineer (Electrical)</h4><span>Type</span><span>Recruitment Test</span><span>Last date</span><span>24 Nov 2026</span></div></body></html>`;
describe("dates", () => { it("parses long dates", () => { expect(parseLongDate("7th December 2026")).toBe("2026-12-07"); expect(parseLongDate("24 Nov 2026")).toBe("2026-11-24"); expect(parseLongDate("soon")).toBeNull(); }); });
describe("NTS", () => { it("reads titles and deadlines", () => { const r = parseNts(NTS); expect(r.broken).toBe(false); expect(r.items.map((i) => i.lastDate)).toEqual(["2026-12-07", "2026-11-30"]); expect(r.items[1].title).toContain("Khyber"); expect(r.items[1].officialUrl).toContain("id=2"); });
  it("flags a page with no rows as broken", () => { expect(parseNts("<html><body>hi</body></html>").broken).toBe(true); }); });
describe("OTS", () => { it("reads project cards", () => { const r = parseOtsList(OTS); expect(r.items).toHaveLength(1); expect(r.items[0].title).toBe("Islamabad Capital Territory Police"); expect(r.items[0].externalId).toBe("ICT2026A"); expect(r.items[0].expand).toBe("ots-project"); });
  it("reads category deadlines", () => { expect(parseOtsProject(OTSP)).toEqual([{ title: "Assistant Manager / Junior Engineer (Electrical)", lastDate: "2026-11-24" }]); }); });

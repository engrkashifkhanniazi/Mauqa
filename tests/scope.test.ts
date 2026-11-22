import { describe, it, expect } from "vitest";
import { checkScope } from "../src/pipeline/scope";
import { evaluate } from "../src/pipeline/rules";
describe("scope: KP + Islamabad only", () => {
  it("keeps Islamabad, KP and federal", () => {
    expect(checkScope("Managing Director", "Ministry of Federal Education", "Islamabad").inScope).toBe(true);
    expect(checkScope("Teacher", "E&SED", "Bannu").inScope).toBe(true);
    expect(checkScope("Clerk", "Peshawar High Court").inScope).toBe(true);
  });
  it("rejects other provinces", () => {
    expect(checkScope("Lead Talent Acquisition", "Punjab Life Insurance", "Lahore").inScope).toBe(false);
    expect(checkScope("Constable", "Sindh Prisons", "Karachi").inScope).toBe(false);
    expect(checkScope("LDC", "Balochistan Quota").inScope).toBe(false);
  });
  it("keeps ads with no location", () => { expect(checkScope("Assistant", "Some Department").inScope).toBe(true); });
  it("evaluate rejects out-of-scope", () => {
    const d = evaluate({ title: "Clerk", regionText: "Lahore", officialUrl: "https://nts.org.pk/x", lastDate: "2999-01-01" });
    expect(d.action).toBe("reject");
  });
});

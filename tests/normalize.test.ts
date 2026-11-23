import { describe, it, expect } from "vitest";
import { normProvince, normCity, cleanTitle, isAdmission, eduLevel, sourceKind } from "../src/lib/normalize";
import { payRange } from "../src/lib/pay";
describe("normalize", () => {
  it("fills province from city, department and source", () => {
    expect(normProvince("", "Peshawar", "", "FPSC")).toBe("Khyber Pakhtunkhwa");
    expect(normProvince("", "", "Office of the Senior Civil Judge Karak", "Daily Ausaf")).toBe("Khyber Pakhtunkhwa");
    expect(normProvince("", "Islamabad", "", "ETEA")).toBe("Islamabad / Federal");
    expect(normProvince("", "", "", "NJP")).toBe("Islamabad / Federal");
    expect(normProvince("", "", "", "ETEA")).toBe("Khyber Pakhtunkhwa");
    expect(normProvince("Federal", "", "", "ETEA")).toBe("Islamabad / Federal");
    expect(normProvince("", "Lahore", "", "Daily Jang")).toBe("Nationwide / Other");
  });
  it("merges city spellings", () => { expect(normCity("Dir Upper")).toBe("Upper Dir"); expect(normCity("upper dir")).toBe("Upper Dir"); expect(normCity("dera ismail khan")).toBe("D.I. Khan"); expect(normCity("")).toBe(""); });
  it("strips wrapping parentheses only when balanced", () => {
    expect(cleanTitle("(BSN (Generic) 4 Year Degree Program 2026-27)")).toBe("BSN (Generic) 4 Year Degree Program 2026-27");
    expect(cleanTitle("(Induction of Field Production Trainees)")).toBe("Induction of Field Production Trainees");
    expect(cleanTitle("Lecturer (BPS-17) (Male)")).toBe("Lecturer (BPS-17) (Male)");
  });
  it("flags admission and test notices, not jobs", () => {
    expect(isAdmission("National Aptitude Test, NAT-XII 2026")).toBe(true);
    expect(isAdmission("BSN (Generic) 4 Year Degree Program 2026-27")).toBe(true);
    expect(isAdmission("Programme Officer")).toBe(false);
    expect(isAdmission("Induction of Field Production Trainees")).toBe(false);
  });
  it("buckets education and sources", () => {
    expect(eduLevel("Master's in Chemistry")).toBe("master");
    expect(eduLevel("16 years education in Finance")).toBe("bachelor");
    expect(eduLevel("Diploma of Associate Engineer")).toBe("inter");
    expect(eduLevel("Middle")).toBe("matric");
    expect(eduLevel("MBBS")).toBe("medical");
    expect(sourceKind("ETEA")).toBe("testing"); expect(sourceKind("FPSC")).toBe("portal"); expect(sourceKind("Daily Mashriq")).toBe("paper");
  });
  it("shows the official BPS-2026 basic pay range", () => { expect(payRange(17)).toBe("Rs 54,140 – 136,340"); expect(payRange(null)).toBe(""); });
});

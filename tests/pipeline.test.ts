import { describe, it, expect } from "vitest";
import { evaluate } from "../src/pipeline/rules";
import { parseEteaDate, parseBps } from "../src/pipeline/normalise";
import { dedupeScore, classify } from "../src/pipeline/dedupe";
import { withinBudget, costUsd } from "../src/pipeline/budget";

const today = new Date("2026-11-22T10:00:00Z");
const ok = { title: "Senior Civil Judge Peshawar - 2026", officialUrl: "https://etea.online/apply/", lastDate: "2026-12-15" };
describe("rules engine", () => {
  it("publishes a complete job, unverified by default", () => { const d = evaluate(ok, today); expect(d.action).toBe("publish"); expect(d.verified).toBe(false); });
  it("verified only when confirmed by code", () => expect(evaluate({ ...ok, fieldsConfirmedAgainstSource: true }, today).verified).toBe(true));
  it("never verified when AI was used", () => expect(evaluate({ ...ok, aiUsed: true, aiConfidence: 0.95, fieldsConfirmedAgainstSource: true }, today).verified).toBe(false));
  it("quarantines past deadline", () => expect(evaluate({ ...ok, lastDate: "2026-11-01" }, today).action).toBe("quarantine"));
  it("quarantines missing title / deadline", () => { expect(evaluate({ ...ok, title: "" }, today).action).toBe("quarantine"); expect(evaluate({ ...ok, lastDate: null }, today).action).toBe("quarantine"); });
  it("accepts explicit no-deadline flag", () => expect(evaluate({ ...ok, lastDate: null, noDeadlineStated: true }, today).action).toBe("publish"));
  it("quarantines wrong domain", () => expect(evaluate({ ...ok, officialUrl: "https://evil.example/etea.online" }, today).action).toBe("quarantine"));
  it("quarantines low AI confidence", () => expect(evaluate({ ...ok, aiUsed: true, aiConfidence: 0.8 }, today).action).toBe("quarantine"));
  it("quarantines conflicts", () => expect(evaluate({ ...ok, conflictsWithExisting: true }, today).action).toBe("quarantine"));
  it("rejects results notices", () => expect(evaluate({ ...ok, title: "Result of Written Test Staff Nurse" }, today).action).toBe("reject"));
});
describe("normalise", () => {
  it("parses ETEA dates", () => { expect(parseEteaDate("15-December-2026")).toBe("2026-12-15"); expect(parseEteaDate("5-March-2027")).toBe("2027-03-05"); expect(parseEteaDate("garbage")).toBeNull(); });
  it("parses BPS", () => { expect(parseBps("Lecturer (BPS-18)")).toBe(18); expect(parseBps("no scale")).toBeNull(); });
});
describe("dedupe", () => {
  const a = { employer: "Health Department", title: "Staff Nurse", vacancies: 30, lastDate: "2026-12-09", location: "Peshawar" };
  it("identical is auto-link", () => expect(classify(dedupeScore(a, a))).toBe("auto-link"));
  it("different is distinct", () => expect(classify(dedupeScore(a, { employer: "Police", title: "Constable", vacancies: 5, lastDate: "2027-01-01", location: "Swat" }))).toBe("distinct"));
});
describe("budget", () => {
  it("blocks at or over cap and when cap unset", () => { expect(withinBudget(4.99, 5)).toBe(true); expect(withinBudget(5, 5)).toBe(false); expect(withinBudget(0, 0)).toBe(false); });
  it("unknown model cost is infinite", () => expect(costUsd("gpt-x", 1, 1)).toBe(Infinity));
});

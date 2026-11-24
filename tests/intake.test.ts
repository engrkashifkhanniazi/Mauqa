import { describe, it, expect } from "vitest";
import { intakeTokenOk, sameAdKey } from "../src/lib/intake";

describe("intake token", () => {
  const T = "x".repeat(32);
  it("accepts only the exact token", () => {
    expect(intakeTokenOk(T, T)).toBe(true);
    expect(intakeTokenOk(T + "y", T)).toBe(false);
    expect(intakeTokenOk("", T)).toBe(false);
    expect(intakeTokenOk(null, T)).toBe(false);
  });
  it("is closed when the token is missing or short", () => {
    expect(intakeTokenOk("abc", "")).toBe(false);
    expect(intakeTokenOk("short", "short")).toBe(false);
  });
});

describe("same ad key", () => {
  it("matches the same ad from two editions despite spacing/case", () => {
    expect(sameAdKey("Junior Clerk  (BPS-11)", "2026-12-10", "Health Department")).toBe(sameAdKey("junior clerk bps-11", "2026-12-10", "health department"));
  });
  it("differs when the last date differs", () => {
    expect(sameAdKey("Junior Clerk", "2026-12-10")).not.toBe(sameAdKey("Junior Clerk", "2026-12-11"));
  });
});

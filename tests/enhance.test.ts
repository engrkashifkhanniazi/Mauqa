import { test, expect, vi } from "vitest";
vi.mock("@/db", () => ({ db: () => ({ execute: async () => ({ rows: [] }) }) }));
import sharp from "sharp";
test("enhance enlarges small crops", async () => {
  const { enhance } = await import("../src/lib/adImage");
  const src = await sharp({ create: { width: 400, height: 600, channels: 3, background: "#ddd" } }).jpeg().toBuffer();
  const out = await enhance(src); const m = await sharp(out).metadata();
  expect(m.width).toBe(800); expect(m.format).toBe("jpeg");
});

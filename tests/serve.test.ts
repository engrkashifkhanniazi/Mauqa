import { test, expect } from "vitest";
import sharp from "sharp";
import { forPhone } from "../src/lib/adServe";
const jpg = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#ddd" } }).jpeg().toBuffer();
test("small ad crop is enlarged within 1200x1600", async () => {
  const out = await forPhone(await jpg(375, 769)); const m = await sharp(out).metadata();
  expect(m.format).toBe("jpeg"); expect(m.height).toBe(1600); expect(m.width).toBe(780);
});
test("wide small crop is enlarged to 1200 px wide", async () => {
  const m = await sharp(await forPhone(await jpg(600, 400))).metadata();
  expect(m.width).toBe(1200); expect(m.height).toBe(800);
});
test("already big picture is returned untouched", async () => {
  const src = await jpg(604, 1839); expect(await forPhone(src)).toBe(src);
});

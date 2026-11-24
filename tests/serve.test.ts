import { test, expect } from "vitest";
import sharp from "sharp";
import { forPhone } from "../src/lib/adServe";
const jpg = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#ddd" } }).jpeg().toBuffer();
test("small ad crop is enlarged to 1200 px wide, tall ads stay tall", async () => {
  const out = await forPhone(await jpg(375, 769)); const m = await sharp(out).metadata();
  expect(m.format).toBe("jpeg"); expect(m.width).toBe(1200); expect(m.height).toBe(2461);
});
test("wide small crop is enlarged to 1200 px wide", async () => {
  const m = await sharp(await forPhone(await jpg(600, 400))).metadata();
  expect(m.width).toBe(1200); expect(m.height).toBe(800);
});
test("very tall crop is limited to 3200 px high", async () => {
  const m = await sharp(await forPhone(await jpg(300, 1600))).metadata();
  expect(m.height).toBe(3200); expect(m.width).toBe(600);
});
test("already big picture is returned untouched", async () => {
  const src = await jpg(1250, 1839); expect(await forPhone(src)).toBe(src);
});

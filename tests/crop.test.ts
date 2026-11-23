import { test, expect } from "vitest";
import sharp from "sharp";
import { cropAd } from "../src/pipeline/adCrop";
test("crop", async () => {
  const page = await sharp({ create: { width: 3000, height: 4000, channels: 3, background: "#fff" } }).jpeg().toBuffer();
  const tile = { x: 0, y: 0, w: 1680, h: 2240 };
  const c = await cropAd(page, tile, [0.1, 0.1, 0.6, 0.5]);
  const m = await sharp(c!).metadata(); expect(m.width).toBeGreaterThan(700); expect(m.width).toBeLessThanOrEqual(1600);
  expect(await cropAd(page, tile, [0.1, 0.1, 0.15, 0.12])).toBeUndefined();
  expect(await cropAd(page, tile, null)).toBeUndefined();
});

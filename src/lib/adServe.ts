import sharp from "sharp";

/** Applied when an ad picture is served (not stored, so the database stays small).
 *  Newspaper pages are only ~1000 px wide, so a typical ad crop is 300-600 px: on a phone the screen enlarges it badly.
 *  Here it is enlarged once, properly (lanczos) and sharpened, up to 1200 px wide / 1600 px tall (WhatsApp keeps about 1600 px on the long side).
 *  This makes text cleaner, it cannot add detail that the newspaper page never had. Pictures that are already big are returned untouched. */
export async function forPhone(input: Buffer): Promise<Buffer> {
  const m = await sharp(input, { failOn: "none" }).metadata();
  const w = m.width ?? 0, h = m.height ?? 0;
  if (!w || !h) return input;
  const scale = Math.min(1200 / w, 1600 / h);
  if (scale < 1.15) return input;
  return sharp(input, { failOn: "none" })
    .resize({ width: Math.round(w * scale), height: Math.round(h * scale), kernel: "lanczos3" })
    .normalise({ lower: 1, upper: 99 })
    .sharpen({ sigma: 1.0, m1: 0.5, m2: 2 })
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
}

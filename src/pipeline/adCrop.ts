import sharp from "sharp";

/** Cuts one ad out of the page from the model's box; returns undefined when the box is implausible. */
export async function cropAd(page: Buffer, tile: { x: number; y: number; w: number; h: number }, box: number[] | null | undefined): Promise<Buffer | undefined> {
  if (!box) return undefined;
  const [l, t, r, b] = box;
  if (!(r - l > 0.12 && b - t > 0.06)) return undefined; // too small to be a whole ad
  const meta = await sharp(page).metadata(); const W = meta.width ?? 0, H = meta.height ?? 0;
  const m = 0.012; // small margin so a slightly tight box does not clip the border
  const left = Math.max(0, Math.floor(tile.x + (l - m) * tile.w)), top = Math.max(0, Math.floor(tile.y + (t - m) * tile.h));
  const right = Math.min(W, Math.ceil(tile.x + (r + m) * tile.w)), bottom = Math.min(H, Math.ceil(tile.y + (b + m) * tile.h));
  if (right - left < 200 || bottom - top < 150) return undefined;
  return sharp(page).extract({ left, top, width: right - left, height: bottom - top }).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

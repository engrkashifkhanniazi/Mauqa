import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
/** OCR a scanned PDF with poppler + tesseract (both free CLIs; installed in the GitHub Actions job). Returns the text, or null if tools are missing. */
export function ocrPdf(pdf: Uint8Array, maxPages = 40, dpi = 170): string | null {
  const dir = mkdtempSync(join(tmpdir(), "ocr-"));
  try {
    writeFileSync(join(dir, "in.pdf"), pdf);
    execFileSync("pdftoppm", ["-r", String(dpi), "-f", "1", "-l", String(maxPages), "-gray", "-png", join(dir, "in.pdf"), join(dir, "pg")], { stdio: "ignore", timeout: 300000 });
    const pages = readdirSync(dir).filter((f) => /^pg-\d+\.png$/.test(f)).sort();
    let out = "";
    for (const p of pages) {
      execFileSync("tesseract", [join(dir, p), join(dir, p.replace(".png", "")), "--psm", "6"], { stdio: "ignore", timeout: 120000 });
      out += readFileSync(join(dir, p.replace(".png", ".txt")), "utf8") + "\n";
    }
    return out;
  } catch { return null; } finally { rmSync(dir, { recursive: true, force: true }); }
}

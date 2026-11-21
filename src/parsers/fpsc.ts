import type { ParseResult } from "./types";
/** FPSC: structure not yet mapped (site unreachable from the build environment, robots.txt unreadable).
 *  Intentionally reports `broken` so health alerts fire instead of silently ingesting guesses.
 *  Implement once a real fixture of /category/advertisements is saved in tests/fixtures/fpsc-list.html. */
export function parseFpsc(_html: string): ParseResult {
  return { items: [], emptyState: false, broken: true, note: "FPSC parser not implemented: needs real fixture" };
}

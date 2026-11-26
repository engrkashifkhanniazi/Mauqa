/** Reads a JSON array even when the answer was cut off: keeps every complete {...} item. */
export function jsonArrayLoose(t: string): unknown[] {
  const a = t.indexOf("["); if (a < 0) return [];
  try { const b = t.lastIndexOf("]"); if (b > a) return JSON.parse(t.slice(a, b + 1)); } catch { /* fall through */ }
  const out: unknown[] = []; let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = a + 1; i < t.length; i++) {
    const c = t[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true; else if (c === "{") { if (depth++ === 0) start = i; } else if (c === "}" && depth > 0 && --depth === 0 && start >= 0) { try { out.push(JSON.parse(t.slice(start, i + 1))); } catch { /* skip */ } start = -1; }
  }
  return out;
}

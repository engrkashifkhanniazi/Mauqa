import { sql } from "drizzle-orm";
import { db } from "../src/db";
// Exits 2 (workflow then opens a GitHub issue) if a source had 3 consecutive zero-item runs (excluding legit empty states) or a broken parser.
(async () => {
  const srcs = ((await db().execute(sql`select id, key from sources`)) as unknown as { rows: { id: number; key: string }[] }).rows; const bad: string[] = [];
  for (const s of srcs) {
    const runs = ((await db().execute(sql`select items_seen, errors from ingest_runs where source_id = ${s.id} and finished_at is not null order by id desc limit 3`)) as unknown as { rows: { items_seen: number; errors: { type: string }[] }[] }).rows;
    if (runs.length === 3 && runs.every((r) => r.items_seen === 0 && !r.errors.some((e) => e.type === "empty_state"))) bad.push(`${s.key}: zero items for 3 runs`);
    if (runs[0]?.errors.some((e) => e.type === "parser_broken")) bad.push(`${s.key}: parser broken`);
  }
  if (bad.length) { console.error(bad.join("\n")); process.exit(2); } console.log("all sources healthy");
})();

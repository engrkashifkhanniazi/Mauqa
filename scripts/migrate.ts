import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "node:fs";
(async () => {
  const sql = neon(process.env.DATABASE_URL!);
  await sql.query("create table if not exists _migrations (name text primary key, applied_at timestamptz default now())");
  const done = new Set(((await sql.query("select name from _migrations")) as { name: string }[]).map((r) => r.name));
  for (const f of readdirSync("drizzle").filter((x) => x.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    for (const stmt of readFileSync(`drizzle/${f}`, "utf8").split("--> statement-breakpoint").map((x) => x.trim()).filter(Boolean)) await sql.query(stmt);
    await sql.query("insert into _migrations (name) values ($1)", [f]); console.log("applied", f);
  }
})();

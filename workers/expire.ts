import { sql } from "drizzle-orm";
import { db } from "../src/db";
(async () => { // closes past-deadline jobs; never deletes
  const r = await db().execute(sql`update jobs set status = 'closed', updated_at = now() where status = 'published' and last_date < current_date returning id`);
  console.log(`closed ${(r.rows ?? []).length} jobs`);
})();

import { neon } from "@neondatabase/serverless";
(async () => {
  const q = neon(process.env.DATABASE_URL!);
  console.log("jobs by status:", JSON.stringify(await q.query("select s.key, j.status, count(*)::int n from jobs j join sources s on s.id=j.source_id group by 1,2 order by 1,2")));
  console.log("queue reasons:", JSON.stringify(await q.query("select reason, count(*)::int n from review_queue where resolved_at is null group by 1")));
  console.log("sample:", JSON.stringify(await q.query("select title, department, bps, vacancies, city, last_date::text, status from jobs order by id limit 25")));
})();

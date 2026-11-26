import { neon } from "@neondatabase/serverless";
(async () => {
  const q = neon(process.env.DATABASE_URL!);
  const show = async (label: string, s: string) => { try { console.log(label + ":", JSON.stringify(await q.query(s))); } catch (e) { console.log(label + ": ERROR", (e as Error).message); } };
  await show("jobs by status", "select s.key, j.status, count(*)::int n from jobs j join sources s on s.id=j.source_id group by 1,2 order by 1,2");
  await show("added last 3 days", "select s.key, j.status, count(*)::int n from jobs j join sources s on s.id=j.source_id where j.created_at > now() - interval '3 days' group by 1,2 order by 1,2");
  await show("newest 25", "select j.id, s.key, j.status, left(j.title,60) t, j.last_date, j.created_at from jobs j join sources s on s.id=j.source_id order by j.id desc limit 25");
  await show("queue reasons", "select reason, count(*)::int n from review_queue where resolved_at is null group by 1");
  await show("ai calls last 3 days", "select date_trunc('day', created_at) d, model, count(*)::int n, sum(tokens_out)::int out, round(sum(cost_usd)::numeric,3) usd from ai_calls where created_at > now() - interval '3 days' group by 1,2 order by 1");
  await show("ai month spend", "select round(coalesce(sum(cost_usd),0)::numeric,3) usd from ai_calls where created_at >= date_trunc('month', now())");
  await show("pages seen last 3 days", "select s.key, count(*)::int n from raw_items r join sources s on s.id=r.source_id where r.kind='page' and r.fetched_at > now() - interval '3 days' group by 1");
})();

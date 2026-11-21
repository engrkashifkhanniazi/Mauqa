import { notFound } from "next/navigation";
import { queryJobs } from "@/lib/jobs";
export const revalidate = 600;
const KEYS = ["fpsc", "kppsc", "etea"];
export default async function SourcePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params; if (!KEYS.includes(key.toLowerCase())) notFound();
  const { jobs } = await queryJobs({ source: [key.toUpperCase()], limit: 100 });
  return (<main className="wrap" style={{ padding: "28px 20px 60px" }}><p><a href="/">← Home</a></p><h1>{key.toUpperCase()} jobs</h1>
    {jobs.length ? <ul>{jobs.map((j) => <li key={j.id}><a href={`/jobs/${j.slug}`}>{j.title}</a> — {j.lastDate}</li>)}</ul> : <p>No open advertisements right now. We keep checking.</p>}</main>);
}

import { getJobs } from "@/lib/jobs";
import Browser from "@/components/Browser";

export const revalidate = 300;

export default async function Home() {
  const { jobs, sample } = await getJobs();
  return <Browser jobs={jobs} sample={sample} />;
}

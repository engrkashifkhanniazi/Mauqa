import type { JobView } from "./types";
import { SEED } from "./seed";

export async function getJobs(): Promise<{ jobs: JobView[]; sample: boolean }> {
  // Step 2: seeded sample data. Replaced by a Postgres query once DATABASE_URL is configured.
  return { jobs: SEED, sample: true };
}

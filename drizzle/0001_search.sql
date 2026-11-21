CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(department,'') || ' ' || coalesce(city,''))) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS jobs_search_tsv_idx ON jobs USING gin (search_tsv);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS jobs_title_trgm_idx ON jobs USING gin (title gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS jobs_dept_trgm_idx ON jobs USING gin (department gin_trgm_ops);

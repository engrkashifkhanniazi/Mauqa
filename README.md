# Rozgar Desk

Pakistani government job aggregator (FPSC, KPPSC, ETEA; newspapers behind a flag). Next.js App Router, Drizzle + Neon Postgres, GitHub Actions workers, Claude only as an image-reading fallback.

## Setup
1. `npm ci`
2. Create a free Neon project; copy the **pooled** connection string into `DATABASE_URL`.
3. `DATABASE_URL=... npm run db:migrate`
4. `npm run dev`. Without `DATABASE_URL` the site shows clearly-labelled sample data and never says "Verified".

## Environment variables
| Name | Where | Purpose |
|---|---|---|
| DATABASE_URL | Vercel + GitHub | Neon pooled connection |
| ANTHROPIC_API_KEY | GitHub (worker) | image extraction fallback only |
| CLAUDE_MONTHLY_BUDGET_USD | GitHub | hard monthly cap; AI stops when reached; unset/0 = AI disabled |
| ADMIN_PASSWORD | Vercel | /admin login |
| CRON_SECRET | Vercel | reserved for authenticated cron endpoints |
| RESEND_API_KEY, MAIL_FROM | Vercel | optional, free-tier email for alert confirmation |
| NEXT_PUBLIC_SITE_URL | Vercel | canonical/sitemap base |
| NEWSPAPER_PIPELINE_ENABLED | GitHub | `true` to enable newspapers (default off) |
Secrets live only in Vercel / GitHub encrypted secrets. Never commit them.

## Workers (GitHub Actions)
`ingest.yml` every 3 h runs `npm run worker` (add `-- --dry` to parse without writing, `-- --source=ETEA` for one source), then a health check that opens a GitHub issue on 3 zero-item runs or a broken parser. `expire.yml` nightly closes past-deadline jobs (never deletes).

## Pipeline
fetch (robots.txt, 1 req/s/host, ETag, backoff, descriptive UA) -> raw hash -> parser (code) -> Claude only for image ads (Haiku, then Sonnet if confidence < 0.85 or invalid; cached by content hash; capped) -> rules engine (the only path to `published`) -> review queue. "Verified" requires code-confirmed fields and no AI.

## Add a source
1. Save a real HTML fixture to `tests/fixtures/`. 2. Add `src/parsers/<key>.ts` returning `ParseResult` (a layout you don't recognise must return `broken: true`). 3. Add its domain to `ALLOWED_DOMAINS` in `src/pipeline/rules.ts`. 4. Register it in `SOURCES` in `workers/run.ts`. 5. Add parser tests.

## Newspaper pipeline
Off by default. Do not enable until each publisher has given permission. Set `NEWSPAPER_PIPELINE_ENABLED=true`; `workers/newspapers.ts` is currently a stub. Never store or republish page images or ad text.

## Known gaps
FPSC parser is unimplemented (needs a real fixture). Fixtures for ETEA/KPPSC are reconstructed, not raw captures (see tests/fixtures/README.md). Anthropic model prices in `src/pipeline/budget.ts` must be verified.

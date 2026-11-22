# Rozgar Desk

Pakistani government job aggregator. Live: https://rozgardesk.vercel.app

Stack: Next.js App Router, TypeScript, plain CSS tokens, Drizzle + Neon Postgres, Zod, Vitest, Playwright, GitHub Actions.

## Honest status
- FPSC: ingested. The advertisement is a scanned PDF, so posts are read with free OCR (tesseract). They are always shown as **Unverified**; "Verified" is only set when code confirms a listing.
- ETEA: the site returns 403 to GitHub Actions. Paused (`PAUSED_SOURCES`, default `ETEA`). Add ETEA listings by hand in /admin. The ETEA parser has not been tested against real HTML.
- KPPSC: parser handles the empty state only.
- Newspaper pipeline: behind a flag, OFF. Not implemented until publishers permit it.
- Claude vision fallback: never exercised (no API key set, AI disabled). Prices in `budget.ts` are placeholders.
- Alert emails need `RESEND_API_KEY` (not set).
- Vercel Hobby is non-commercial; check before adding ads.

## Setup
1. Create a Neon database and set `DATABASE_URL` in Vercel and in GitHub secrets.
2. Vercel env: `ADMIN_PASSWORD`, `CRON_SECRET`, optional `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `CLAUDE_MONTHLY_BUDGET_USD`.
3. Run the **migrate** workflow, then **ingest**.

## Workflows
migrate, ingest (every 3h; `dry` input), expire, status (counts and queue), live-check, live-test (Playwright 390 and 1440 plus Lighthouse), ci.

## Adding a source
Write a parser in `src/parsers/`, register it in `workers/run.ts`, add a real raw-HTML fixture and a test. Every listing goes through `evaluate()` in `src/pipeline/rules.ts`, the only publish path. Doubtful items go to the review queue.

## Rules
robots.txt respected, descriptive User-Agent, at most 1 request/s per host, no CAPTCHA, login or paywall bypass. Secrets live only in Vercel and GitHub.

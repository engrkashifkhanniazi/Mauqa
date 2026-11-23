# Mauqa

Pakistani government job aggregator (formerly Rozgar Desk). Live: https://mauqa.vercel.app

Stack: Next.js App Router, TypeScript, plain CSS tokens, Drizzle + Neon Postgres, Zod, Vitest, Playwright, GitHub Actions.

## Honest status
- FPSC: ingested. The advertisement is a scanned PDF, so posts are read with free OCR (tesseract). They are always shown as **Unverified**; "Verified" is only set when code confirms a listing.
- ETEA: the site returns 403 to GitHub Actions. Paused (`PAUSED_SOURCES`, default `ETEA`). Add ETEA listings by hand in /admin. The ETEA parser has not been tested against real HTML.
- KPPSC: parser handles the empty state only.
- Newspapers: Daily Mashriq e-paper pipeline is built (`workers/newspapers.ts`, workflow `newspapers`, daily). It reads page images in memory, Claude extracts facts only, and the site links to the e-paper page. Page images and ad text are never stored. It waits quietly until the GitHub secret `ANTHROPIC_API_KEY` exists. Spend cap: `CLAUDE_MONTHLY_BUDGET_USD` secret, default 8 USD when unset. Not yet run end to end with a real key; check the admin review queue after the first run. Papers covered: Daily Mashriq (Peshawar) and Daily Jang (Lahore, Karachi, Pindi editions). Others need an entry in `PAPERS` (workers/newspapers.ts). Nawa-i-Waqt and Ausaf are not added: their sites show bot challenges (Cloudflare) and from GitHub the Nawa-i-Waqt pages cannot be fetched; we do not bypass these.
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

## Ads, analytics and site settings (Vercel env, then redeploy)
- `NEXT_PUBLIC_ADSENSE_CLIENT` (ca-pub-…): turns on the AdSense script, the `google-adsense-account` meta tag and `/ads.txt`.
- `NEXT_PUBLIC_AD_SLOT_LIST_FEED`, `NEXT_PUBLIC_AD_SLOT_JOB_MID`, `NEXT_PUBLIC_AD_SLOT_JOB_END`: ad unit ids. A slot with no id renders nothing.
  Placement is policy-minded: in-feed after the 4th and 12th job card; on job pages after "How to apply" and at the end. Never next to buttons, filters or navigation, labelled "Advertisements", with reserved height so nothing jumps.
- `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP_CHANNEL`: Contact page email and the "Follow on WhatsApp" link (hidden when empty).
- Vercel Web Analytics is wired in (`@vercel/analytics`); enable it in the project's Analytics tab.

## How to apply text
Admin "Add a job" has a short "How to apply, from the ad" box; paste lines accept it as an optional 8th part after the date. When filled, job pages show it as "From the advertisement"; otherwise a short, clearly labelled general guidance is shown.

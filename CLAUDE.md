# Mauqa (موقع): project memory for Claude Code

Read this first. It is the hand-over from the Cowork sessions (Nov 2026) so you know everything the previous assistant knew.

## Owner and how to talk to him
- Owner: **Kashif** (GitHub `engrkashifkhanniazi`). Not a programmer; he decides, you build, test and deploy.
- **Reply in Roman Urdu, left-to-right** (Latin letters, e.g. "Theek hai, main kar deta hoon"). Do NOT put U+200F / RTL marks around English words: they scramble the text in his app. Urdu script is fine inside the website, not in chat replies.
- He prefers **full, clear answers** (he asked "mukhtasar nai, wahi jawab do" when an answer was too short). Use plain words, explain the why in one line.
- Give links and commands in their own code block so nothing invisible sticks to them (a hidden mark once broke `/admin` → 404).
- **End every reply with a "📌 Aaj/Kal aap ke kaam" reminder list** of his pending tasks (see "Pending for Kashif" below). Remove items he confirms done.
- Ask before anything irreversible or public (buying, posting, accepting terms, deleting data). Never bypass CAPTCHAs, logins or Cloudflare challenges.

## What the product is
Government-jobs website for **Khyber Pakhtunkhwa + Islamabad/Federal** (will later grow to all provinces/departments, so the name is not tied to newspapers or KP).
- Live: https://mauqa.vercel.app (English) and https://mauqa.vercel.app/ur (Urdu). Old URL rozgardesk.vercel.app redirects public pages (308) to mauqa; `/admin` and `/api` still work on both.
- Repo: https://github.com/engrkashifkhanniazi/Mauqa (renamed from `rozgardesk`; old URL redirects).
- Vercel: project `mauqa` (id `prj_gZGn3n8dN3BgRbUFGmLEWdpFOAC4`, team `team_53aPWcjCgYo2N5KlUkaPuxKB`), **Hobby (free) plan**. Push to `main` = production deploy (~3 min).
- Database: Neon Postgres (`DATABASE_URL` in Vercel + GitHub secrets). Admin: `/admin` (password `ADMIN_PASSWORD`).
- Former name "Rozgar Desk" was dropped on 23 Nov 2026 (collided with "KPK Rozgar Support Program", rozgar.com, Rozee.pk). Name chosen by Kashif: **Mauqa**.

## Stack and commands
Next.js 16 App Router + React 19, TypeScript, plain CSS (`src/app/globals.css`), Drizzle + Neon, Zod, Vitest, Playwright, GitHub Actions, `@vercel/analytics`.
```
npm install
npm run dev            # local, sample data when DATABASE_URL is unset
npx tsc --noEmit       # typecheck
npx vitest run         # unit tests (51)
npm run build && npm start
BASE_URL=http://localhost:3000 npx playwright test   # e2e, mobile 390px + desktop 1440px (24)
```
Before every push: typecheck, vitest, build, e2e, and look at screenshots on phone width (360/390/412) and desktop, in English AND `/ur`. Kill old servers first (`pkill -f next-server`): a stale server serving a new build gives 500s and fake test failures.

## Where things are
- `src/components/Browser.tsx`: the homepage (EN `.u2` design, UR `.u3` design, one component, `lang` prop). Filters, chips, pills, sort, 15 + "Show more", mobile bottom-sheet filters, bottom tabs, job drawer with WhatsApp share.
- `src/app/page.tsx` (EN) and `src/app/ur/page.tsx` (UR, its own URL so there is no language flash). Layout head script sends a saved-Urdu visitor from `/` to `/ur` before paint.
- `src/app/jobs/[slug]/page.tsx`: job page (~400 words): facts, source-type label, ad picture, Who can apply, official BPS-2026 basic pay, How to apply (admin's own text from the ad if given, else short labelled general guidance + step-by-step `<details>`), document checklist, FAQ, similar jobs, JSON-LD JobPosting + Breadcrumb. `opengraph-image.tsx` = WhatsApp/Facebook preview card.
- `src/lib/normalize.ts`: province (KP / Islamabad-Federal / Nationwide-Other) from city, department, source; city spelling fixes (Dir Upper → Upper Dir); title clean-up; admission/test-notice flag (hidden by default); source kind labels; education level buckets. Applied in `toView()` in `src/lib/jobs.ts`.
- `src/lib/pay.ts`: Finance Division Revised Basic Pay Scales 2026 (O.M. 21 Jul 2026, effective 1 Jul 2026), min/max basic pay per BPS. Basic pay only; never invent gross salary.
- `src/lib/howto.ts`: short guidance, step-by-step guides, checklist.
- `src/lib/site.ts`: all site settings from env (below).
- Admin (`src/app/admin/page.tsx`): add job by hand (incl. "How to apply, from the ad" box and ad picture), paste many (`title;;department;;city;;vacancies;;bps;;education;;YYYY-MM-DD;;how to apply` - last part optional), review queue, Contact messages, Closed jobs (reopen with new date), tools.
- Pages: `/about`, `/contact` (form → `contact_messages` table, shown in admin), `/privacy`, `/terms`, `/disclaimer`, `/ads.txt` (404 until AdSense id set), `manifest.webmanifest` + `public/sw.js` (installable app).
- Workers/workflows: `workers/run.ts` (FPSC, KPPSC, NTS, ATS… every 3 h, `ingest.yml`), `workers/newspapers.ts` (Mashriq, Jang Pindi, Express ISB, Aaj Peshawar; 06:30/08:30/10:30 PKT, needs `ANTHROPIC_API_KEY`, budget cap `CLAUDE_MONTHLY_BUDGET_USD`), `workers/expire.ts` (nightly ~01:30 PKT: past-date jobs → `closed`, never deleted). See `docs/MORNING_RUN.md`.
- Runtime-created columns/tables (also in `drizzle/`): `jobs.apply_how`, `job_images`, `contact_messages`.

## Rules that must stay true
- **Honesty:** a listing is "Verified" only when code confirmed it against the source. Never print "Unverified" on cards (shows source type instead: Official portal / Testing agency / Newspaper ad) and never claim verification that did not happen. The general how-to text is always labelled as general; the ad wins.
- robots.txt respected, 1 req/s per host, no CAPTCHA/login/paywall/Cloudflare bypass. ETEA, OTS, PTS, NJP, Nawa-i-Waqt, Ausaf refuse GitHub servers → added by hand or by Kashif's daily Chrome task.
- **Closed jobs:** hidden from homepage/search/sitemap at once; page stays with "Closed" notice, `noindex`, no JobPosting, **no ads, no share button**; page 404s after 90 days; data never deleted; admin can reopen.
- **AdSense placement (policy-safe):** in-feed after the 6th and 14th card; job page after the FAQ/How-to section and at the very end; never next to buttons, filters, nav or the apply link; label "Advertisements"; reserved min-height (no CLS). No ads on closed or thin pages. Slots render nothing until env ids exist.
- Vercel Hobby terms (Section 4) = personal/non-commercial only. Before ads go live, move to Vercel Pro ($20/mo) or Cloudflare Workers ($5/mo; would need porting the `sharp` image code).

## Environment settings (Vercel → redeploy)
`NEXT_PUBLIC_SITE_URL` (set when the custom domain arrives), `NEXT_PUBLIC_ADSENSE_CLIENT` (ca-pub-…; turns on script, meta tag, ads.txt), `NEXT_PUBLIC_AD_SLOT_LIST_FEED`, `NEXT_PUBLIC_AD_SLOT_JOB_MID`, `NEXT_PUBLIC_AD_SLOT_JOB_END`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP_CHANNEL`, plus server secrets `DATABASE_URL`, `ADMIN_PASSWORD`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY` (alert emails; not set yet, so alerts are stored but not emailed).

## Daily routine (scheduled task "Mauqa: Ausaf aur Nawa-i-Waqt ke ads")
Runs ~11:05 PKT on Kashif's laptop via Claude in Chrome: reads today's Ausaf Islamabad, Ausaf Peshawar and Nawa-i-Waqt Islamabad e-papers, sends him a crop of each KP/Islamabad government job ad + a ready post-line in the paste format. It never posts; Kashif posts via admin. Ausaf is behind a Cloudflare check that usually clears by itself in ~20 s; never solve it.

## Pending for Kashif (put these in the reminder list)
1. Google Search Console: add `https://mauqa.vercel.app` (URL prefix, HTML-tag method), give you the meta tag (or let you do it in his Chrome), then submit `/sitemap.xml`. Put the tag in `metadata.verification.google` in `src/app/layout.tsx`.
2. Vercel Web Analytics is enabled on the Hobby plan; if Visitors stays 0, Redeploy once.
3. In a claude.ai chat, grant access to the renamed repo `engrkashifkhanniazi/Mauqa` and recreate the daily scheduled task there (the old session only had `rozgardesk`).
4. Optional: create the WhatsApp Channel and send the link (→ `NEXT_PUBLIC_WHATSAPP_CHANNEL`).
5. Before applying to AdSense: buy the domain (recommended **mauqa.pk** via a PKNIC registrar: Rs 2,100/yr, 2 years paid at once = Rs 4,200; or mauqa.com ≈ $11/yr at Cloudflare/Porkbun; availability not yet checked) and give a real contact email.

## When the domain arrives (checklist)
Add domain in Vercel → set `NEXT_PUBLIC_SITE_URL` → redirect `mauqa.vercel.app` to the domain (extend the host redirect in `next.config.ts`) → update tests/live config, README, scheduled-task prompt → add the domain in Search Console → resubmit sitemap.

## Backlog ideas (agreed or suggested, not built)
- Hub pages per agency/city (`/etea-jobs`, `/kppsc-jobs`, `/peshawar-jobs`, `/islamabad-jobs-today`) with intro text: biggest SEO win.
- 15-20 evergreen guide articles (ETEA how-to, BPS chart, age relaxation, domicile, FPSC form) for AdSense "valuable content".
- Telegram channel auto-posting (official Bot API). WhatsApp Channels have no official posting API: keep manual share.
- Optional 4th newspaper run at ~01:30 PKT (costs Claude API money; Kashif not yet decided).
- Alert emails (needs `RESEND_API_KEY`) and matching on region + qualification (already stored in `alerts.query_json`).
- Fonts: layout loads 7 Google font families; trimming helps Core Web Vitals (check which classes still use them first).

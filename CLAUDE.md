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
- Workers/workflows: `workers/run.ts` (FPSC, KPPSC, NTS, ATS… every 3 h, `ingest.yml`), `workers/newspapers.ts` (Mashriq, Jang Pindi, Express ISB, Aaj Peshawar; 09:30/11:30 PKT (GitHub schedules often run hours late), needs `ANTHROPIC_API_KEY`, budget cap `CLAUDE_MONTHLY_BUDGET_USD`), `workers/expire.ts` (nightly ~01:30 PKT: past-date jobs → `closed`, never deleted). See `docs/MORNING_RUN.md`.
- Runtime-created columns/tables (also in `drizzle/`): `jobs.apply_how`, `job_images`, `contact_messages`.

## Newspaper reading (fixed 26 Nov 2026)
- `pageHasJobAds()` checks each page as two full-resolution halves; any doubt = yes (the old whole-page check said "no" for every page on 25 Nov). Pages are marked `raw_items.kind='page3'`; older marks are read again once.
- `extractPageAds(page, editionYmd)`: Haiku on 2x2 tiles; an unclear ad (confidence < 0.85 or no date) gets a second read of its own cut-out by Sonnet; "apply within N days" becomes edition date + N. Ads still unreadable stay in the review queue (never published as guesses).
- KPPSC ad PDFs: 16k output tokens + `jsonArrayLoose`; if posts still cannot be read, the ad is listed once as "KPPSC Advertisement No. X (various posts)" with the date from its link title.
- Diagnostics: run the `status` workflow (read-only) for jobs by source/status, AI spend, pages seen.

## Rules that must stay true
- **Honesty:** a listing is "Verified" only when code confirmed it against the source. Never print "Unverified" on cards (shows source type instead: Official portal / Testing agency / Newspaper ad) and never claim verification that did not happen. The general how-to text is always labelled as general; the ad wins.
- robots.txt respected, 1 req/s per host, no CAPTCHA/login/paywall/Cloudflare bypass. ETEA, OTS, PTS, NJP, Nawa-i-Waqt, Ausaf refuse GitHub servers → added by hand or by Kashif's daily Chrome task.
- **Closed jobs:** hidden from homepage/search/sitemap at once; page stays with "Closed" notice, `noindex`, no JobPosting, **no ads, no share button**; page 404s after 90 days; data never deleted; admin can reopen.
- **AdSense placement (policy-safe):** in-feed after the 6th and 14th card; job page after the FAQ/How-to section and at the very end; never next to buttons, filters, nav or the apply link; label "Advertisements"; reserved min-height (no CLS). No ads on closed or thin pages. Slots render nothing until env ids exist.
- Vercel Hobby terms (Section 4) = personal/non-commercial only. Before ads go live, move to Vercel Pro ($20/mo) or Cloudflare Workers ($5/mo; would need porting the `sharp` image code).

## No admissions / scholarships (owner decision 24 Nov 2026)
Never ingest or show scholarships, admissions, entrance/aptitude tests (NAT, GAT…). `evaluate()` in `src/pipeline/rules.ts` rejects them via `isAdmission`; `src/lib/jobs.ts` and the sitemap filter any old ones; the homepage "include admission" checkbox is removed.

## Sharing and ad pictures (decided 24 Nov 2026)
- Share message (`src/components/ShareBar.tsx`): bold title, department, last date, one line "Pay, how to apply and documents" + the job link, an optional "Posts: n · BPS-x" line, then a "follow our WhatsApp channel" line with `NEXT_PUBLIC_WHATSAPP_CHANNEL`. Urdu text when the page language is Urdu. On phones that can share files the green WhatsApp button sends the ad picture together with this text (Web Share API; the picture is preloaded so the tap works). Kashif posts to his channel this way. Format modelled on another job channel's posts (big readable picture + short Urdu caption + link + channel line), but with our own link.
- Ad picture quality: stored crops are small because e-paper pages are only ~1000-1200 px wide (Mashriq page 1000x1820), so a one-third-width ad is ~375 px. `src/lib/adServe.ts` `forPhone()` enlarges small pictures when they are served (not stored; up to 1200 wide x 3200 tall, lanczos + normalise + sharpen) so text is cleaner; it cannot add detail. Another KPK job channel Kashif showed (Ali Infoz Official) gets its clarity mostly from original ads (ETEA, ASF, MLC career portals) and posts Urdu 2-4 line summary + official apply link + channel line. Real fix = a better source: the department's own PDF/image (upload it in admin, Ad picture box) or a high-resolution e-paper PDF.

## Environment settings (Vercel → redeploy)
`NEXT_PUBLIC_SITE_URL` (set when the custom domain arrives), `NEXT_PUBLIC_ADSENSE_CLIENT` (ca-pub-…; turns on script, meta tag, ads.txt), `NEXT_PUBLIC_AD_SLOT_LIST_FEED`, `NEXT_PUBLIC_AD_SLOT_JOB_MID`, `NEXT_PUBLIC_AD_SLOT_JOB_END`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP_CHANNEL`, plus server secrets `DATABASE_URL`, `ADMIN_PASSWORD`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY` (alert emails; not set yet, so alerts are stored but not emailed).

## Daily laptop routines (Claude in Chrome) and automatic posting (decided 24 Nov 2026)
Kashif wants everything posted automatically, no admin step.
- `/api/intake` (`src/app/api/intake/route.ts`, `src/lib/intake.ts`): POST multipart `source`, `officialUrl`, `line` (paste format), optional `adImage`, `dry=1`; header `x-mauqa-intake` = env `INTAKE_TOKEN`; CORS for allowed e-paper/agency hosts. Runs `evaluate()` (scope, admissions, past dates), duplicate check (`sameAdKey` in `dedupe_key`, or same title+date), publishes, saves picture. Never "Verified".
- Scheduled task "Mauqa: Ausaf aur Nawa-i-Waqt ke ads": 11:05 PKT, Ausaf Islamabad (station_id=1), Ausaf Peshawar (station_id=3), Nawa-i-Waqt Islamabad; crops each ad in the e-paper tab (canvas) and posts it to `/api/intake`.
- Scheduled task "Mauqa: ETEA, OTS, PTS, NJP ki jobs": 11:20 and 15:20 PKT, ETEA/OTS/PTS/NJP (+ KPPSC/FPSC as a cross-check), posts to `/api/intake`.
- Both prompts contain the intake token; if `INTAKE_TOKEN` is changed in Vercel, update both prompts. Never solve Cloudflare/CAPTCHA.

## Pending for Kashif (put these in the reminder list)
0. Add `INTAKE_TOKEN` in Vercel (Production, value = the token in the two scheduled-task prompts) and redeploy; until then `/api/intake` answers 401 and the laptop runs cannot post.
1. Before applying to AdSense: buy the domain and give a real contact email. **mauqa.com is taken** (checked 24 Nov 2026). Recommended **mauqa.pk** via a PKNIC registrar (Rs 2,100/yr, 2 years = Rs 4,200); its availability is not checked yet (PKNIC lookup needs Kashif to allow the site in Claude in Chrome, or he checks it himself).

Done 24 Nov 2026: Search Console property `https://mauqa.vercel.app/` verified by HTML tag (`metadata.verification.google` in `src/app/layout.tsx`; never remove it) and `/sitemap.xml` submitted (Success). Vercel Web Analytics works (4 visitors / 35 page views in the week to 24 Nov). The daily scheduled task exists on this account and runs at 11:05 PKT; pushes to the renamed repo work. WhatsApp Channel https://whatsapp.com/channel/0029VbDgJDj6hENwWW0DCS31 set as `NEXT_PUBLIC_WHATSAPP_CHANNEL` (Follow banner on homepage EN/UR and job pages).

## When the domain arrives (checklist)
Add domain in Vercel → set `NEXT_PUBLIC_SITE_URL` → redirect `mauqa.vercel.app` to the domain (extend the host redirect in `next.config.ts`) → update tests/live config, README, scheduled-task prompt → add the domain in Search Console → resubmit sitemap.

## Backlog ideas (agreed or suggested, not built)
- Hub pages per agency/city (`/etea-jobs`, `/kppsc-jobs`, `/peshawar-jobs`, `/islamabad-jobs-today`) with intro text: biggest SEO win.
- 15-20 evergreen guide articles (ETEA how-to, BPS chart, age relaxation, domicile, FPSC form) for AdSense "valuable content".
- Telegram channel auto-posting (official Bot API). WhatsApp Channels have no official posting API: keep manual share.
- Optional 4th newspaper run at ~01:30 PKT (costs Claude API money; Kashif not yet decided).
- Alert emails (needs `RESEND_API_KEY`) and matching on region + qualification (already stored in `alerts.query_json`).
- Fonts: layout loads 7 Google font families; trimming helps Core Web Vitals (check which classes still use them first).

# Morning run (browser mode)

Scope: Khyber Pakhtunkhwa + Islamabad (incl. federal). Other provinces are skipped (the rules engine also enforces this).

## Runs by itself (GitHub Actions, no laptop)
| Source | Needs ANTHROPIC_API_KEY | Workflow |
|---|---|---|
| FPSC (OCR of scanned ad PDF) | no | ingest.yml, every 3 h |
| KPPSC (PDF ads) | yes | ingest.yml |
| NTS | no | ingest.yml |
| ATS | no | ingest.yml |
| Daily Mashriq (Peshawar) | yes | newspapers.yml, 06:30 / 08:30 / 10:30 PKT |
| Daily Jang (Pindi) | yes | newspapers.yml |
| Daily Express (Islamabad edition) | yes | newspapers.yml |
| Daily Aaj (Peshawar edition) | yes | newspapers.yml |

## Needs the laptop + Claude in Chrome (GitHub is refused or cannot read it)
ETEA (etea.online, 403 to GitHub) · OTS (403) · PTS (JavaScript-rendered) · NJP (TLS chain not verifiable from GitHub)
Nawa-i-Waqt (islamabad) and Ausaf (Islamabad) are also in workers/newspapers.ts but are refused/blocked from GitHub today; they start working by themselves only if that changes.
Express and Aaj now have automatic readers (workers/newspapers.ts). Nawa-i-Waqt and Ausaf are still laptop-only (503 / Cloudflare 403 from GitHub).
The worker also keeps a cropped picture of each ad (job_images table) when the AI box is trustworthy; admin can attach a picture by hand when adding a listing.

Text sources are read as page text (cheap). Only newspaper pages are read as images (expensive).
Entry point: admin -> "Paste many jobs at once" with `title;;department;;city;;vacancies;;bps;;education;;YYYY-MM-DD`.
Never saved: images, PDFs, ad text. Never bypassed: CAPTCHAs, logins, bot checks.

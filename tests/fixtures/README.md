# Fixtures
- `fpsc-jobs-gr.raw.html` is a REAL, unmodified capture (RozgarDeskBot via politeFetch from GitHub Actions, 2026-11-22) of https://www.fpsc.gov.pk/Jobs?section=GR.
- `etea-table.reconstructed.html` and `kppsc-empty.reconstructed.html` are NOT raw captures: they were reconstructed from rendered text.
  ETEA returns 403 to our host, so its parser is still unverified against real HTML. KPPSC's empty state was seen live ("No active advertisement!").
Replace the reconstructed files with real saved HTML and re-run `npm test` before trusting those two parsers.

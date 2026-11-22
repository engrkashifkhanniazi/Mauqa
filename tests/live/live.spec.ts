import { test, expect } from "@playwright/test";
const SITE = "https://rozgardesk.vercel.app";

test("home loads with real FPSC listings and no console errors", async ({ page }) => {
  const errs: string[] = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto("/"); await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Assistant Draftsman", exact: true })).toBeVisible();
  await expect(page.getByText("Sample", { exact: true })).toHaveCount(0);
  expect(errs, errs.join("\n")).toEqual([]);
});
test("no real listing claims Verified (all are read from a scanned PDF)", async ({ page }) => {
  await page.goto("/"); await page.waitForLoadState("networkidle");
  await expect(page.locator(".cap span", { hasText: /^Verified$/ })).toHaveCount(0);
});
test("search narrows the list", async ({ page }) => {
  await page.goto("/"); await page.waitForLoadState("networkidle");
  await page.getByLabel("Job title or keyword").fill("Psychologist");
  await expect(page.getByRole("button", { name: "Psychologist", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Assistant Draftsman", exact: true })).toHaveCount(0);
});
test("job detail page: JSON-LD JobPosting, canonical on the right domain, unverified notice, official link", async ({ page, request }) => {
  const { jobs } = await (await request.get("/api/jobs?limit=1")).json();
  expect(jobs.length).toBeGreaterThan(0);
  const j = jobs[0];
  await page.goto("/jobs/" + j.slug);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(j.title);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp("^" + SITE));
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "{}");
  expect(ld["@type"]).toBe("JobPosting"); expect(ld.title).toBe(j.title);
  await expect(page.getByText(/Not yet verified/)).toBeVisible();
  await expect(page.locator(`a[href^="https://www.fpsc.gov.pk"]`).first()).toBeVisible();
});
test("api: validates input and returns real jobs", async ({ request }) => {
  expect((await request.get("/api/jobs?bps=abc")).status()).toBe(400);
  const r = await (await request.get("/api/jobs?limit=100")).json(); expect(r.jobs.length).toBeGreaterThan(5);
  for (const j of r.jobs) { expect(j.verified).toBe(false); expect(j.officialUrl).toMatch(/^https:\/\/(www\.)?(fpsc|kppsc)\.gov\.pk|etea\.online/); }
});
test("alerts: bad email rejected; admin API locked", async ({ request }) => {
  expect((await request.post("/api/alerts", { data: { email: "nope" } })).status()).toBeGreaterThanOrEqual(400);
  expect((await request.post("/api/admin/add", { multipart: { title: "x" } })).status()).toBe(401);
  expect((await request.post("/api/admin/resolve", { multipart: { id: "1", action: "publish" } })).status()).toBe(401);
});
test("admin page asks for a password; privacy page exists", async ({ page }) => {
  await page.goto("/admin"); await expect(page.getByLabel("Password")).toBeVisible();
  await page.goto("/privacy"); await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
test("robots and sitemap point at the live domain and list real job pages", async ({ request }) => {
  const r = await (await request.get("/robots.txt")).text(); expect(r).toContain(SITE + "/sitemap.xml"); expect(r).toContain("Disallow: /admin");
  const s = await (await request.get("/sitemap.xml")).text(); expect(s).toContain(SITE + "/jobs/"); expect(s).not.toContain("rozgar-desk.vercel.app");
  expect(s).not.toMatch(/\/jobs\/[^<]*\/[^<]*<\/loc>/);
});

import { pgTable, serial, text, integer, boolean, timestamp, date, numeric, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  lastStatus: text("last_status"),
  etag: text("etag"),
});

export const rawItems = pgTable("raw_items", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull().references(() => sources.id),
  url: text("url").notNull(),
  contentHash: text("content_hash").notNull().unique(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  kind: text("kind").notNull(), // html | pdf | image
  storageRef: text("storage_ref"), // hash/pointer only, never the image itself
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  department: text("department"),
  sourceId: integer("source_id").notNull().references(() => sources.id),
  province: text("province"),
  city: text("city"),
  bps: integer("bps"),
  vacancies: integer("vacancies"),
  education: text("education"),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  lastDate: date("last_date"),
  noDeadlineStated: boolean("no_deadline_stated").notNull().default(false),
  postedDate: date("posted_date"),
  status: text("status").notNull().default("quarantined"), // published|quarantined|rejected|closed
  confidence: numeric("confidence", { precision: 3, scale: 2 }),
  officialUrl: text("official_url").notNull(),
  applyUrl: text("apply_url"),
  applyHow: text("apply_how"),
  dedupeKey: text("dedupe_key"),
  contentHash: text("content_hash").notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("jobs_status_last_date_idx").on(t.status, t.lastDate),
  index("jobs_province_idx").on(t.province),
  index("jobs_bps_idx").on(t.bps),
  index("jobs_dedupe_key_idx").on(t.dedupeKey),
  uniqueIndex("jobs_source_hash_uq").on(t.sourceId, t.contentHash),
]);

export const jobFiles = pgTable("job_files", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  kind: text("kind").notNull(), // advertisement|corrigendum|syllabus|apply
});

export const aiCache = pgTable("ai_cache", {
  contentHash: text("content_hash").primaryKey(),
  model: text("model").notNull(),
  resultJson: jsonb("result_json").notNull(),
  tokensIn: integer("tokens_in").notNull(),
  tokensOut: integer("tokens_out").notNull(),
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  queryJson: jsonb("query_json").notNull(),
  token: text("token").notNull().unique(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewQueue = pgTable("review_queue", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const ingestRuns = pgTable("ingest_runs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull().references(() => sources.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  itemsSeen: integer("items_seen").notNull().default(0),
  itemsNew: integer("items_new").notNull().default(0),
  errors: jsonb("errors").notNull().default([]),
});

// Logged for every AI call (spend tracking + monthly cap)
export const aiCalls = pgTable("ai_calls", {
  id: serial("id").primaryKey(),
  contentHash: text("content_hash").notNull(),
  model: text("model").notNull(),
  tokensIn: integer("tokens_in").notNull(),
  tokensOut: integer("tokens_out").notNull(),
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(),
  ok: boolean("ok").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

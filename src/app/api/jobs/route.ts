import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { queryJobs } from "@/lib/jobs";
const Q = z.object({ q: z.string().max(100).optional(), province: z.string().max(40).optional(), bps: z.string().regex(/^\d{1,2}-\d{1,2}$/).optional(), source: z.string().max(100).optional(),
  closing: z.coerce.number().int().min(1).max(365).optional(), sort: z.enum(["closing", "vacancies"]).optional(), cursor: z.string().max(100).optional(), limit: z.coerce.number().int().min(1).max(100).optional() });
export async function GET(req: NextRequest) {
  const p = Q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!p.success) return NextResponse.json({ error: "invalid query", issues: p.error.issues }, { status: 400 });
  const [a, b] = p.data.bps ? p.data.bps.split("-").map(Number) : [undefined, undefined];
  const r = await queryJobs({ q: p.data.q, province: p.data.province, bpsMin: a, bpsMax: b, source: p.data.source?.split(","), closingWithin: p.data.closing, sort: p.data.sort, cursor: p.data.cursor, limit: p.data.limit });
  return NextResponse.json(r, { headers: { "cache-control": "public, s-maxage=120, stale-while-revalidate=600" } });
}

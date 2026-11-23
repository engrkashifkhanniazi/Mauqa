import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { enhanceAll } from "@/lib/adImage";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  if (!isAdmin(req.cookies.get("rd_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const n = await enhanceAll();
  return new NextResponse(`<!doctype html><meta charset="utf-8"><title>Pictures</title><body style="font-family:sans-serif;max-width:600px;margin:40px auto"><h2>Done</h2><p>${n} ad picture(s) made clearer.</p><p><a href="/admin">Admin</a></p>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}

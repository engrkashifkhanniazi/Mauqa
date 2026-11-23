import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { enhanceAll } from "@/lib/adImage";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  if (!isAdmin(req.cookies.get("rd_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ enhanced: await enhanceAll() });
}

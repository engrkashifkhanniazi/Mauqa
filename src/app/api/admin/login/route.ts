import { NextRequest, NextResponse } from "next/server";
import { adminToken, checkPassword } from "@/lib/adminAuth";
export async function POST(req: NextRequest) {
  const f = await req.formData(); const ok = checkPassword(String(f.get("password") ?? ""));
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  if (ok) res.cookies.set("rd_admin", adminToken()!, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 8 * 3600 });
  return res;
}

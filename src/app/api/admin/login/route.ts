import { NextRequest, NextResponse } from "next/server";
import { adminToken, checkPassword } from "@/lib/adminAuth";
export async function POST(req: NextRequest) {
  const f = await req.formData(); const ok = checkPassword(String(f.get("password") ?? ""));
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  if (ok) res.cookies.set("rd_admin", adminToken()!, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 7 * 86400 });
  // visibility flag only (no secret): lets the site show Kashif a one-tap Admin link; the real check stays on the server
  if (ok) res.cookies.set("rd_is_admin", "1", { httpOnly: false, secure: true, sameSite: "strict", path: "/", maxAge: 7 * 86400 });
  return res;
}

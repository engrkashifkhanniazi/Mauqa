import { ADSENSE_CLIENT } from "@/lib/site";
/** ads.txt for AdSense. Filled automatically from NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-… becomes pub-…). */
export const dynamic = "force-static";
export function GET() {
  const pub = ADSENSE_CLIENT.replace(/^ca-/, "");
  if (!pub) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

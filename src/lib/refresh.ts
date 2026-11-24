import { revalidatePath } from "next/cache";
/** After any admin change, rebuild the cached public pages at once instead of waiting for the 5-minute timer. */
export function refreshSite() {
  try { for (const p of ["/", "/ur", "/sitemap.xml"]) revalidatePath(p); } catch { /* never block the admin action */ }
}

"use client";
import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/site";
/** One AdSense unit. Renders nothing until NEXT_PUBLIC_ADSENSE_CLIENT and this slot id are set, so the page never shows empty boxes.
 *  The wrapper reserves height (CSS .ad-*) so ads do not push content around when they load. */
export default function AdSlot({ slot, kind = "rect" }: { slot: string; kind?: "rect" | "banner" | "feed" }) {
  const done = useRef(false);
  const on = Boolean(ADSENSE_CLIENT && slot);
  useEffect(() => { if (!on || done.current) return; done.current = true; try { ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle ||= []).push({}); } catch {} }, [on]);
  if (!on) return null;
  return (<aside className={`ad ad-${kind}`} aria-label="Advertisement"><span className="ad-l">Advertisements</span>
    <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={ADSENSE_CLIENT} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" /></aside>);
}

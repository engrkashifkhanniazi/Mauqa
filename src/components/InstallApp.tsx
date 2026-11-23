"use client";
import { useEffect, useState } from "react";
type BIP = Event & { prompt: () => Promise<void> };
/** Registers the service worker and shows an "Install app" button when the browser offers installation (Android Chrome, desktop Chrome/Edge). */
export default function InstallApp({ className = "" }: { className?: string }) {
  const [ev, setEv] = useState<BIP | null>(null);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const h = (e: Event) => { e.preventDefault(); setEv(e as BIP); };
    window.addEventListener("beforeinstallprompt", h); const g = () => setEv(null); window.addEventListener("appinstalled", g);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", g); };
  }, []);
  if (!ev) return null;
  return <button type="button" className={"inst " + className} onClick={async () => { await ev.prompt(); setEv(null); }}><span className="t-en">Install app</span><span className="t-ur" lang="ur">ایپ انسٹال کریں</span></button>;
}

import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import AdminLink from "@/components/AdminLink";
import { SITE, ADSENSE_CLIENT } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Mauqa | Government jobs in KP and Islamabad", template: "%s | Mauqa" },
  description: "Latest government jobs in Khyber Pakhtunkhwa and Islamabad from newspapers, FPSC, KPPSC, ETEA, NTS and other testing services. Last dates, pay scale, how to apply and the official advertisement.",
  applicationName: "Mauqa",
  openGraph: { title: "Mauqa", description: "Government jobs in KP and Islamabad, checked daily, with the official advertisement.", type: "website", siteName: "Mauqa", locale: "en_PK" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Mauqa", statusBarStyle: "black-translucent" },
  other: ADSENSE_CLIENT ? { "google-adsense-account": ADSENSE_CLIENT } : {},
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0A2620" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=Playfair+Display:wght@700;900&family=Noto+Nastaliq+Urdu:wght@500&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('rdt');if(t)document.documentElement.dataset.theme=t;var l=localStorage.getItem('rdl');if(l==='ur'){document.documentElement.lang='ur';document.documentElement.dir='rtl'}}catch(e){}` }} />
        {ADSENSE_CLIENT && <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />}
      </head>
      <body>{children}<AdminLink /><Analytics /></body>
    </html>
  );
}

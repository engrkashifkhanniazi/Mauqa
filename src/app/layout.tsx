import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://rozgar-desk.vercel.app"),
  title: { default: "Rozgar Desk | Pakistan government jobs, found and verified", template: "%s | Rozgar Desk" },
  description: "FPSC, KPPSC, ETEA and newspaper job advertisements in one place, each linked to the official source.",
  openGraph: { title: "Rozgar Desk", description: "Pakistan government jobs linked to official advertisements.", type: "website", siteName: "Rozgar Desk" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0A2620" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&family=Noto+Nastaliq+Urdu:wght@500&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('rdt');if(t)document.documentElement.dataset.theme=t;var l=localStorage.getItem('rdl');if(l==='ur'){document.documentElement.lang='ur';document.documentElement.dir='rtl'}}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

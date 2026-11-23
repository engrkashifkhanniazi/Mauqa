import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Mauqa: Government Jobs", short_name: "Mauqa", description: "Government jobs in KP and Islamabad from newspapers, commissions and testing services, checked daily.",
    start_url: "/?source=app", scope: "/", display: "standalone", background_color: "#F4F8F6", theme_color: "#0A2620", lang: "en",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] };
}

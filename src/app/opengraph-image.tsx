import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site";
export const alt = "Mauqa: government jobs in Pakistan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, padding: "64px", background: "linear-gradient(135deg,#0A2620 0%,#0E6B4D 100%)", color: "#fff", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 84, height: 84, borderRadius: 20, background: "#2FC79A", color: "#04251C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, fontWeight: 800 }}>M</div>
        <div style={{ fontSize: 64, fontWeight: 800 }}>Mauqa</div>
      </div>
      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>Government jobs in KP and Islamabad, checked daily</div>
      <div style={{ fontSize: 30, color: "#BFE6D6" }}>{`Newspaper, commission and testing-service ads in one place · ${SITE_HOST}`}</div>
    </div>, size);
}

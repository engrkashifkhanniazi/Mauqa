"use client";
import { useEffect, useState } from "react";

/** Shown only on a browser where the admin has signed in. Everyone else sees nothing. */
export default function AdminLink() {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(document.cookie.split("; ").includes("rd_is_admin=1") && !location.pathname.startsWith("/admin")); }, []);
  if (!on) return null;
  return <a href="/admin" aria-label="Open admin" style={{ position: "fixed", right: 14, bottom: 14, zIndex: 50, background: "#0A2620", color: "#fff", padding: "10px 16px", borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,.3)" }}>Admin</a>;
}

"use client";
import { useState } from "react";
export default function ContactForm() {
  const [state, setState] = useState<"" | "sending" | "ok" | string>("");
  return (<form className="cf" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setState("sending");
    try { const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(f.entries())) }); const d = await r.json();
      if (r.ok) { setState("ok"); (e.target as HTMLFormElement).reset(); } else setState(d.error ?? "Something went wrong."); } catch { setState("Network error. Please try again."); } }}>
    <div className="cf-row"><label htmlFor="cf-name">Your name (optional)<input id="cf-name" name="name" maxLength={100} autoComplete="name" /></label>
      <label htmlFor="cf-email">Your email *<input id="cf-email" name="email" type="email" required maxLength={200} autoComplete="email" dir="ltr" /></label></div>
    <label htmlFor="cf-topic">About<select id="cf-topic" name="topic" defaultValue="correction"><option value="correction">A mistake in a job listing</option><option value="missing">A job advertisement you missed</option><option value="alerts">Job alerts / remove my email</option><option value="other">Something else</option></select></label>
    <label htmlFor="cf-url">Job page link (if any)<input id="cf-url" name="pageUrl" maxLength={400} placeholder="https://mauqa.vercel.app/jobs/…" dir="ltr" /></label>
    <label htmlFor="cf-msg">Message *<textarea id="cf-msg" name="message" required minLength={10} maxLength={3000} rows={5} /></label>
    <input name="website" tabIndex={-1} autoComplete="off" className="sr" aria-hidden="true" />
    <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send message"}</button>
    <p role="status" className="cf-st">{state === "ok" ? "Thank you. Your message has reached us; we usually reply within two working days." : state && state !== "sending" ? state : ""}</p>
  </form>);
}

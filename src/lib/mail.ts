const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rozgardesk.vercel.app";
export const mailConfigured = () => !!process.env.RESEND_API_KEY;
/** Sends via Resend's free tier when RESEND_API_KEY is set; otherwise returns false (nothing is sent). */
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM ?? "Rozgar Desk <onboarding@resend.dev>", to, subject, html }) });
  return r.ok;
}
export const confirmUrl = (t: string) => `${SITE}/alerts/confirm?token=${t}`;
export const unsubUrl = (t: string) => `${SITE}/unsubscribe?token=${t}`;

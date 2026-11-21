import { createHash, timingSafeEqual } from "node:crypto";
const tokenFor = (pw: string) => createHash("sha256").update("rd-admin:" + pw).digest("hex");
export const adminToken = () => (process.env.ADMIN_PASSWORD ? tokenFor(process.env.ADMIN_PASSWORD) : null);
export function checkPassword(pw: string) { const t = adminToken(); if (!t) return false; const a = Buffer.from(tokenFor(pw)), b = Buffer.from(t); return a.length === b.length && timingSafeEqual(a, b); }
export function isAdmin(cookie?: string) { const t = adminToken(); if (!t || !cookie) return false; const a = Buffer.from(cookie), b = Buffer.from(t); return a.length === b.length && timingSafeEqual(a, b); }

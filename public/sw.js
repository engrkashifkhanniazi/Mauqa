// Mauqa service worker: makes the site installable and shows the last saved homepage when offline. Never caches /api or /admin.
const C = "mauqa-v1";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.add("/")).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== "GET" || r.mode !== "navigate" || u.origin !== location.origin || u.pathname.startsWith("/api") || u.pathname.startsWith("/admin")) return;
  e.respondWith(fetch(r).then((res) => { if (u.pathname === "/" && res.ok) { const copy = res.clone(); caches.open(C).then((c) => c.put("/", copy)); } return res; })
    .catch(() => caches.match(r).then((m) => m || caches.match("/"))));
});

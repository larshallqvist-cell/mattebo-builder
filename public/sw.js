// Kill-switch: ersätter den gamla service workern, tömmer dess cache och avregistrerar sig.
function isWorkboxCacheForThisRegistration(name) {
  const hasWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  return hasWorkboxBucket && name.endsWith(self.registration.scope);
}
const APP_CACHES = ["calendar-cache", "resources-cache", "google-fonts-cache", "gstatic-fonts-cache"];
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        const ours = names.filter((n) => isWorkboxCacheForThisRegistration(n) || APP_CACHES.includes(n));
        await Promise.allSettled(ours.map((n) => caches.delete(n)));
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(clients.map((c) => c.navigate(c.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);

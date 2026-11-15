// Cache only same-origin artwork. Private documents and APIs always use the network.
const CACHE = "railbandhan-art-v3";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("railbandhan-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith("/images/")
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res.ok) {
          await cache.put(request, res.clone());
          const keys = await cache.keys();
          if (keys.length > 40) await cache.delete(keys[0]);
        }
        return res;
      } catch {
        return new Response("", { status: 503, statusText: "Offline" });
      }
    })(),
  );
});

/**
 * Minimal service worker (PWA install + same-origin cache).
 * Must stay at the site root: the default scope is the script’s folder,
 * and GitHub Pages cannot send Service-Worker-Allowed to widen it.
 * Keep CACHE aligned with APP_VERSION (version.js) and the ?v= in index.html
 * (CSS + app.js / version.js import map) and 404.html (CSS).
 */
const CACHE = "brickcard-0.9.0";

function shouldHandleFetch(request) {
  if (request.method !== "GET") return false;
  const dest = request.destination;
  if (dest === "serviceworker" || dest === "sharedworker" || dest === "worker") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.endsWith("/service-worker.js")) return false;
  return true;
}

async function precacheAppShell() {
  const cache = await caches.open(CACHE);
  for (const path of ["./index.html", "./"]) {
    try {
      const res = await fetch(new URL(path, self.location), { cache: "reload" });
      if (res.ok) await cache.put(res.url, res);
    } catch {
      /* GitHub Pages / network: do not fail the install */
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandleFetch(event.request)) return;

  event.respondWith(
    fetch(event.request, { cache: "reload" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(event.request);
        if (hit) return hit;
        if (event.request.mode === "navigate") {
          return (await caches.match("./index.html")) || Response.error();
        }
        return Response.error();
      })
  );
});

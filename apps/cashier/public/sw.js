// POS Service Worker — app shell caching only
// Product images are cached in IndexedDB by the catalog sync module
//
// CACHE_NAME bumped 2026-04-25: activation now purges the v1 cache, which
// held stale Next.js chunks that caused "module factory not available"
// runtime errors after server-action edits on localhost.
const CACHE_NAME = "pos-shell-v2";

// Detect local dev (localhost / 127.0.0.1). When running against a dev
// server, the SW provides no value and actively hurts iteration by caching
// /_next/static/* chunks that get invalidated on every server-action edit.
// In that environment: wipe all caches, unregister self, let the page run
// without any SW interception going forward.
const IS_DEV =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

const APP_SHELL = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install — cache app shell (skip entirely in dev)
self.addEventListener("install", (event) => {
  if (IS_DEV) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches. On dev, also wipe EVERY cache and
// unregister ourselves so no further fetch interception happens.
self.addEventListener("activate", (event) => {
  if (IS_DEV) {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.clients.claim();
        try {
          await self.registration.unregister();
          // Reload every controlled client so they drop the SW control.
          const clients = await self.clients.matchAll({ type: "window" });
          for (const client of clients) {
            if ("navigate" in client) client.navigate(client.url);
          }
        } catch (err) { /* ignore */ }
      })()
    );
    return;
  }
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Message handler — precache chunks on demand
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "PRECACHE_CHUNKS") {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => {
      urls.forEach((url) => {
        cache.match(url).then((existing) => {
          if (!existing) {
            fetch(url).then((res) => {
              if (res.ok) cache.put(url, res).catch(() => {});
            }).catch(() => {});
          }
        });
      });
    });
  }
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  // Dev: never intercept — let the browser hit the dev server directly.
  if (IS_DEV) return;

  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip API routes — always network
  if (url.pathname.startsWith("/api/")) return;

  // Skip product images — handled by IndexedDB, not SW
  if (url.pathname.startsWith("/products/")) return;

  // Navigation (HTML pages) — network first, cache fallback for offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the page for offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached || caches.match("/") || new Response("Offline", { status: 503 })
          )
        )
    );
    return;
  }

  // Static assets (JS/CSS with hashed filenames) — cache first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone).catch(() => {});
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else (icons, manifest, fonts) — network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          cached || new Response("", { status: 503 })
        )
      )
  );
});

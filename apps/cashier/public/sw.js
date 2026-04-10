// POS Service Worker — app shell caching only
// Product images are cached in IndexedDB by the catalog sync module
const CACHE_NAME = "pos-shell-v1";

const APP_SHELL = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install — cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
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

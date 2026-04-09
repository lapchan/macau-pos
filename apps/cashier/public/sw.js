const CACHE_NAME = "pos-v2";

// App shell files to cache on install
const APP_SHELL = [
  "/",
  "/login",
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

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests (POST for server actions, etc.)
  if (request.method !== "GET") return;

  // Skip API routes — always go to network
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  // Navigation requests (page loads) — always network, no cache
  // This ensures middleware auth checks always run
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/") || new Response("Offline", { status: 503 });
      })
    );
    return;
  }

  // Static assets & images — network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (
              url.pathname.startsWith("/_next/static/") ||
              url.pathname.startsWith("/icons/") ||
              url.pathname.startsWith("/products/")
            ) {
              cache.put(request, clone);
            }
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

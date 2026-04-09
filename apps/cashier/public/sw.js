const CACHE_NAME = "pos-v4";

// Install — skip waiting to activate immediately
self.addEventListener("install", () => {
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

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip API routes
  if (url.pathname.startsWith("/api/")) return;

  // Navigation — always network (middleware auth checks)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        new Response("Offline", { status: 503, headers: { "Content-Type": "text/html" } })
      )
    );
    return;
  }

  // Product images — cache first, then network
  if (url.pathname.startsWith("/products/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok && response.type !== "opaque") {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          }).catch(() => new Response("", { status: 503 }));
        })
      )
    );
    return;
  }

  // Everything else — network first, cache static assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type !== "opaque") {
          if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone).catch(() => {});
            });
          }
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          cached || new Response("Offline", { status: 503 })
        )
      )
  );
});

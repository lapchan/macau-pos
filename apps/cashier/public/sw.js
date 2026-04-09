// Pass-through SW: takes over from old SWs, does nothing
// Layout.tsx will unregister this after page loads
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  self.clients.claim();
});
// No fetch handler — all requests go to network

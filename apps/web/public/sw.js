// Minimal service worker: enables PWA installability. No offline caching yet —
// just a pass-through fetch handler, which is what browsers require to be
// present and active for "Add to Home Screen" to offer a full app-like install.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

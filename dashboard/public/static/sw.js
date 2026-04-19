// Minimal service worker stub.
// Some environments request `/static/sw.js`; returning 200 avoids noisy 404 logs.

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", () => {
  // no-op
})

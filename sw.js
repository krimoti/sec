// sw.js — UNIVERSAL offline-cache template.
// Copy this EXACT file, unedited, into every repo/folder on the domain.
// The cache name is derived automatically from this file's own scope
// (its folder URL), so every repo/folder gets a unique, collision-free
// cache with ZERO manual editing — nothing to remember, nothing to forget.

const CACHE_VERSION = 'v1'; // bump ONLY this number to force-refresh THIS app's own cache
const CACHE_NAME = 'offline-' + self.registration.scope + '::' + CACHE_VERSION;
const URLS_TO_CACHE = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  const myPrefix = 'offline-' + self.registration.scope; // this app's own namespace only
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(myPrefix) && k !== CACHE_NAME) // never touches other repos' caches
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept simple GET requests on http(s) — anything else (POST,
  // chrome-extension:, data:, blob:, etc.) is not cacheable and the Cache
  // API throws if you try, which is what was producing the console errors.
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, copy))
              .catch(() => {}); // never let a caching failure surface as an unhandled rejection
          }
          return resp;
        })
        .catch(() => cached); // offline: serve whatever we already have
      return cached || network;
    })
  );
});

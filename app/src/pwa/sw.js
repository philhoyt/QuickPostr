// QuickPostr Service Worker
// Caches the app shell and static assets; network-first for all API calls.

const CACHE_NAME = 'quickpostr-v1';
const SHELL_URL  = self.location.origin + (self.__WP_SLUG__ || '/quickpostr');

// Assets to pre-cache on install.
const PRECACHE_ASSETS = [
  SHELL_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for REST API calls.
  if (url.pathname.includes('/wp-json/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Notify the app that a network request failed (offline).
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: 'OFFLINE_POST_FAILED' })
          );
        });
        return new Response(
          JSON.stringify({ code: 'offline', message: 'You are offline.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Cache-first for everything else (app shell + static assets).
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

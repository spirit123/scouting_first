const CACHE_VERSION = 'ftc-scout-v3';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/app.css',
  '/js/app.js',
  '/js/db.js',
  '/js/ui.js',
  '/js/teams.js',
  '/js/camera.js',
  '/js/sync.js',
  '/js/views/scout.js',
  '/js/views/queue.js',
  '/js/views/gallery.js',
  '/js/views/team-detail.js',
  '/js/views/export.js',
  '/js/views/settings.js',
  '/icons/icon-192.svg',
];

// Install — precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — cache-first for app shell, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for sync, export, status API calls
  if (url.pathname.startsWith('/api/sync') ||
      url.pathname.startsWith('/api/export') ||
      url.pathname.startsWith('/api/status')) {
    return;
  }

  // Cache-then-network for team list API
  if (url.pathname === '/api/teams') {
    event.respondWith(
      caches.open(CACHE_VERSION).then(cache =>
        fetch(event.request)
          .then(response => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cache.match(event.request))
      )
    );
    return;
  }

  // Cache-first for photo images
  if (url.pathname.match(/^\/api\/entries\/.*\/image$/)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Cache-first for app shell assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // SPA fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

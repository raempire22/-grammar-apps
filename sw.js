// Xplore Mindz Grammar Apps — Service Worker
// Caches all app files for offline use

const CACHE_NAME = 'xplore-grammar-v1';

const PRECACHE_URLS = [
  '/~grammar-apps/',
  '/~grammar-apps/index.html',
  '/~grammar-apps/grammarmaster_ai.html',
  '/~grammar-apps/grammar_adventure_buddy.html',
  '/~grammar-apps/little_grammar_friend.html',
  '/~grammar-apps/icon-192.png',
  '/~grammar-apps/icon-512.png',
];

// Install — cache all files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache first, then network
self.addEventListener('fetch', event => {
  // Skip non-GET and external API calls (Anthropic API must go to network)
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('api.anthropic.com')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Offline fallback — return index
        return caches.match('/~grammar-apps/index.html');
      });
    })
  );
});

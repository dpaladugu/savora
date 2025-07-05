// IMPORTANT: This is a very basic service worker.
// For robust PWA capabilities with Vite, including pre-caching of hashed assets,
// it is STRONGLY recommended to use a plugin like 'vite-plugin-pwa'.
// This plugin will auto-generate a more sophisticated service worker.
// The 'urlsToCache' list below is INCOMPLETE for a full offline app shell
// because it cannot know the hashed names of JS/CSS bundles from Vite's build.

const CACHE_NAME = 'savora-cache-v1'; // Updated cache name to match app
const urlsToCache = [
  '/', // The main entry point, often serves index.html
  '/index.html', // Explicitly cache index.html
  // Key static assets (ensure these paths are correct and files exist in public/)
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  // Other important public assets can be added here, e.g., manifest.json if not automatically handled
  '/manifest.json'
  // NOTE: Main JS and CSS bundles (e.g., /assets/index-XXXX.js) are NOT listed here
  // because their names are hashed. vite-plugin-pwa handles this automatically.
  // The current network-first-then-cache strategy in 'fetch' will cache them after first load.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // It's important to be careful with what you cache.
        // Caching too many large files can exceed storage quotas.
        // For a real app, you'd dynamically get these from the build manifest.
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch(err => {
        console.error('Failed to open cache or add URLs:', err);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

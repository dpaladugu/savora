const CACHE_NAME = 'fintrack-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Add paths to your main JS and CSS bundles here
  // e.g., '/assets/index.js', '/assets/index.css'
  // Add other static assets like images, fonts
  '/favicon.ico',
  '/logo192.png', // Assuming these are actual icon names
  '/logo512.png'  // Assuming these are actual icon names
  // Add more assets as needed
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

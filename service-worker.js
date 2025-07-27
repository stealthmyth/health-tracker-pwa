    const CACHE_NAME = 'health-tracker-cache-v11'; // Increment cache version for updates
    const urlsToCache = [
      './', // Cache the root path
      './index.html',
      './App.js',
      './manifest.json',
      'https://cdn.tailwindcss.com',
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      'https://esm.sh/react@18.2.0',
      'https://esm.sh/react-dom@18.2.0/client',
      'https://esm.sh/recharts',
      'https://esm.sh/date-fns',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json', // Exercise database
      './icons/icon-192x192.png', // PNG Icon
      './icons/icon-512x512.png' // PNG Icon
    ];

    // Install event: caches all specified assets
    self.addEventListener('install', (event) => {
      console.log('Service Worker: Install event');
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => {
            console.log('Service Worker: Opened cache');
            // Cache all URLs, handle potential failures gracefully
            return Promise.all(
              urlsToCache.map(url => {
                return cache.add(url).catch(error => {
                  console.warn(`Service Worker: Failed to cache ${url}:`, error);
                  return Promise.resolve(); // Continue even if one fails
                });
              })
            );
          })
          .then(() => self.skipWaiting()) // Forces the waiting service worker to become the active service worker
      );
    });

    // Fetch event: serves cached content first, then falls back to network
    self.addEventListener('fetch', (event) => {
      event.respondWith(
        caches.match(event.request)
          .then((response) => {
            // Cache hit - return response
            if (response) {
              return response;
            }
            // No cache hit - fetch from network
            return fetch(event.request).catch(() => {
              // If network is also unavailable, you could return an offline page
              console.log('Service Worker: Fetch failed, no cache match:', event.request.url);
              // For a more robust app, you might return a fallback HTML page here
              // return caches.match('./offline.html');
            });
          })
      );
    });

    // Activate event: cleans up old caches
    self.addEventListener('activate', (event) => {
      console.log('Service Worker: Activate event');
      const cacheWhitelist = [CACHE_NAME];
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                // Delete old caches
                console.log('Service Worker: Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        }).then(() => self.clients.claim()) // Makes the current service worker control all clients immediately
      );
    });
    
/**
 * Arogya Bhog — Progressive Web App Service Worker
 * Safe, high-performance offline shell & asset caching.
 * 
 * STRICT SECURITY PRINCIPLES:
 * 1. Sensitive customer data, auth tokens, checkout, payments, and live orders are NEVER cached.
 * 2. All /api/ requests bypass the cache completely (Network-Only).
 * 3. Only safe, static assets (HTML shell, CSS, JS, fonts, logo, product imagery) are cached.
 * 4. Stale-free updates with clean cache cleanup on activate.
 */

const CACHE_VERSION = 'v1.0.1';
const STATIC_CACHE_NAME = `arogyabhog-static-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `arogyabhog-images-${CACHE_VERSION}`;

// Pre-cached core application shell and primary product assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/arogyaBhog_logo.png',
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/variants/everyday-soft-multigrain-atta.jpg',
  '/variants/sugar-care-atta.jpg',
  '/variants/thyro-care-atta.jpg',
  '/variants/high-protein-atta.jpg',
  '/variants/vitality-atta.jpg'
];

// Install: Pre-cache static shell assets safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Use cache.addAll with individual resilience so a missing asset doesn't fail install
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[PWA ServiceWorker] Pre-cache skip for ${url}:`, err.message);
          })
        )
      );
    }).then(() => {
      // Force the waiting service worker to become active
      return self.skipWaiting();
    })
  );
});

// Activate: Clean up old, obsolete caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, IMAGE_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log(`[PWA ServiceWorker] Purging outdated cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately so the service worker controls the page without reload
      return self.clients.claim();
    })
  );
});

// Fetch: Smart, secure request routing
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. ALWAYS BYPASS CACHE FOR NON-GET REQUESTS (POST, PUT, PATCH, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // 2. CRITICAL SECURITY: NEVER CACHE SENSITIVE API OR BACKEND DATA
  // All /api/ calls (authentication, checkout, orders, live prices, inventory) are Network-Only
  if (url.pathname.startsWith('/api') || url.hostname.includes('onrender.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return structured offline JSON response if network fails during API call
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: 'You are currently offline. Please reconnect to the internet to complete this action.'
          }),
          {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Navigation Requests (HTML Pages): Network-First with cached /index.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, update the shell cache
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: Serve cached index.html so SPA router loads
          const cachedResponse = await caches.match('/index.html');
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('/');
        })
    );
    return;
  }

  // 4. Static Images (Product variant pictures, ingredients, brand logo, icons)
  if (
    request.destination === 'image' ||
    url.pathname.startsWith('/variants/') ||
    url.pathname.startsWith('/ingredients/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.avif') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Return cached image, but revalidate in background if online
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse);
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache: fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Fallback to primary brand logo if product image fails offline
          return caches.match('/arogyaBhog_logo.png');
        });
      })
    );
    return;
  }

  // 5. Static Assets (CSS, JS, Fonts): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/assets/') ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 6. Default Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request);
    })
  );
});

// Listen for message from frontend to skip waiting on update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

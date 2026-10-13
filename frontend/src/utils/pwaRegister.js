/**
 * Safe Progressive Web App Service Worker Registration & Lifecycle Management
 */

export function registerServiceWorker({ onUpdateAvailable } = {}) {
  if (typeof window === 'undefined') return;

  // Check browser support for Service Worker
  if (!('serviceWorker' in navigator)) {
    console.info('[PWA] Service workers are not supported by this browser.');
    return;
  }

  // Only register in secure contexts (HTTPS or localhost)
  const isSecure = window.location.protocol === 'https:' ||
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';

  if (!isSecure) {
    console.info('[PWA] Service worker registration skipped (requires secure HTTPS context).');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service worker registered successfully with scope:', registration.scope);

        // Check for updates periodically (every 1 hour)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        // Handle update found
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available; notify user
                console.log('[PWA] New application version is available.');
                if (typeof onUpdateAvailable === 'function') {
                  onUpdateAvailable(() => {
                    // Trigger skipWaiting on the waiting worker
                    if (registration.waiting) {
                      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                  });
                }
              } else {
                // Content is cached for offline use for the first time
                console.log('[PWA] Application shell cached for offline use.');
              }
            }
          });
        });
      })
      .catch((error) => {
        // Never allow a service worker failure to crash or block the website
        console.warn('[PWA] Service worker registration failed gracefully:', error);
      });

    // Handle controller change (reloads page when user activates update)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

const CACHE_NAME = 'techbridge-v1.1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install Event - Pre-cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Message handler — supports SKIP_WAITING for seamless updates
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event Handler with Tailored Strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET or cross-origin auth requests
  if (event.request.method !== 'GET') return;

  // Never cache authentication tokens or secrets
  if (url.pathname.includes('/auth/login') || url.pathname.includes('/auth/register')) {
    return;
  }

  // Network-first strategy for dynamic Ticket API endpoints
  if (url.pathname.includes('/api/v1/tickets') || url.pathname.includes('/api/v1/dashboards')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-While-Revalidate for Knowledge Articles
  if (url.pathname.includes('/api/v1/knowledge-articles')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Cache-First for static assets (JS, CSS, HTML, Icons)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200 && event.request.url.startsWith('http')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
      );
    })
  );
});

// Background Sync Handler for queued offline ticket submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tickets') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC' });
        });
      })
    );
  }
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  let payload = { title: 'TechBridge IT Alert', body: 'You have a new support ticket update.' };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    image: '/icons/icon-512.png',
    vibrate: [100, 50, 100],
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data?.url || '/')
  );
});

const CACHE_NAME = 'appointment-pwa-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
  // Do not intercept non-GET requests (POST/PATCH/PUT/DELETE).
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const raw = (event.data && event.data.json && event.data.json()) || {};
  const notification = raw.notification || raw || {};

  const title = notification.title || 'New Notification';
  const body = notification.body || 'You have a new update';
  const icon = notification.icon || '/favicon.ico';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/staff/dashboard');
      }
      return null;
    })
  );
});

const CACHE_NAME = 'appointment-pwa-v2';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
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
  let raw = {};
  try {
    raw = event.data ? event.data.json() : {};
  } catch (_err) {
    try {
      const fallbackText = event.data ? event.data.text() : '';
      raw = fallbackText ? JSON.parse(fallbackText) : {};
    } catch (_fallbackErr) {
      raw = {};
    }
  }
  const notification = raw.notification || raw.webpush?.notification || raw.data || raw || {};
  const clickPath = raw.data?.click_action || raw.click_action || raw.data?.url || raw.url || '/staff/dashboard';

  const title = notification.title || 'New Appointment Request';
  const body = notification.body || 'You have a new appointment update.';
  const icon = notification.icon || '/favicon.ico';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      data: { clickPath },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickPath = event.notification?.data?.clickPath || '/staff/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(clickPath);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickPath);
      }
      return null;
    })
  );
});

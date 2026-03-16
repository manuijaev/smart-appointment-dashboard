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

  // Extract notification data from various possible formats
  let title = 'New Appointment';
  let body = 'You have a new notification';
  let icon = '/icons/icon-192.png';
  let clickPath = '/staff/dashboard';
  
  // Handle different payload formats
  if (raw.notification) {
    title = raw.notification.title || title;
    body = raw.notification.body || body;
    icon = raw.notification.icon || icon;
    if (raw.notification.click_action) clickPath = raw.notification.click_action;
  } else if (raw.data) {
    title = raw.data.title || raw.title || title;
    body = raw.data.body || raw.body || body;
    if (raw.data.url) clickPath = raw.data.url;
    if (raw.data.click_action) clickPath = raw.data.click_action;
  } else {
    title = raw.title || title;
    body = raw.body || body;
    if (raw.url) clickPath = raw.url;
    if (raw.click_action) clickPath = raw.click_action;
  }

  const options = {
    body: body,
    icon: icon,
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'appointment-notification',
    renotify: true,
    requireInteraction: true,
    data: { clickPath },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
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

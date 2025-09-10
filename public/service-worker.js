self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
});

self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetching:', event.request.url);
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'No payload';
  console.log('[Service Worker] Push received:', data);

  const options = {
    body: data,
    icon: '/icon.png',
    badge: '/badge.png',
  };

  event.waitUntil(
    self.registration.showNotification('New Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') 
  );
});

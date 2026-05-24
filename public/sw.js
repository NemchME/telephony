self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const data = (event.notification && event.notification.data) || {};
  const url = data.url || null;
  const callID = data.callID || null;
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (!url || client.url === url || client.url.startsWith(url)) {
          client.focus();
          client.postMessage({ source: 'phone-sw', action: action || 'click', callID });
          return;
        }
      }
      if (url && self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});

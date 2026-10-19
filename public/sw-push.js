// WowSmart — service worker solo para avisos (Web Push). No guarda caché.
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'WowSmart', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Nueva oferta', { body: d.body || '', icon: '/icon.png', badge: '/favicon.png', data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if (w.url.includes(url) && 'focus' in w) return w.focus(); }
    return clients.openWindow(url);
  }));
});

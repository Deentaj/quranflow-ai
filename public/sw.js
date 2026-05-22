self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    self.registration.showNotification(data.title || 'QuranFlow', {
      body: data.body || 'Time for your daily Quran reading 📖',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    });
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    clients.openWindow(event.notification.data.url);
  });
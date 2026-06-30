/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(new NetworkFirst({ cacheName: 'pages' }))
);

self.addEventListener('push', (event) => {
  const data = (event.data?.json() ?? {}) as { title?: string; body?: string };
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Horas', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients: readonly WindowClient[]) => {
        for (const client of windowClients) {
          if ('focus' in client) return (client as WindowClient).focus();
        }
        return self.clients.openWindow('/');
      })
  );
});

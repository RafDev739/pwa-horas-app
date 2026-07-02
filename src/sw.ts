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
  let title = 'Horas';
  let body = '';
  let url = '/';

  if (event.data) {
    try {
      const parsed = event.data.json() as { title?: string; body?: string; url?: string };
      title = parsed.title ?? title;
      body = parsed.body ?? body;
      url = parsed.url ?? url;
    } catch {
      body = event.data.text().slice(0, 80);
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data as { url?: string } | null;
  const raw = data?.url ?? '/';
  let targetPath = '/';
  try {
    const parsed = new URL(raw, self.location.origin);
    if (parsed.origin === self.location.origin) targetPath = parsed.pathname + parsed.search + parsed.hash;
  } catch { /* keep default '/' */ }

  // Append notification content as params so the app can show a banner
  const finalUrl = new URL(targetPath, self.location.origin);
  finalUrl.searchParams.set('_nt', event.notification.title);
  finalUrl.searchParams.set('_nb', event.notification.body);

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients: readonly WindowClient[]) => {
        const dest = finalUrl.pathname + finalUrl.search;
        for (const client of windowClients) {
          if ('focus' in client) {
            (client as WindowClient).navigate(dest);
            return (client as WindowClient).focus();
          }
        }
        return self.clients.openWindow(dest);
      })
  );
});

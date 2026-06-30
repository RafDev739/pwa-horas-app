import webpush from 'web-push';

interface Env {
  PUSH_STORE: KVNamespace;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_EMAIL: string;
}

interface ScheduledNotif {
  id: string;
  title: string;
  body: string;
  fireAt: number;
}

interface StoredSub {
  subscription: webpush.PushSubscription;
  notifications: ScheduledNotif[];
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/sync' && request.method === 'POST') {
      const { subscription, notifications } = await request.json<StoredSub>();
      // Key by endpoint hash so each device has one entry
      const key = 'sub_' + btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-40);
      await env.PUSH_STORE.put(key, JSON.stringify({ subscription, notifications }));
      return new Response('OK', { status: 200, headers: CORS });
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    webpush.setVapidDetails(
      `mailto:${env.VAPID_EMAIL}`,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );

    const now = Date.now();
    const window30min = 30 * 60 * 1000;
    const list = await env.PUSH_STORE.list({ prefix: 'sub_' });

    for (const { name } of list.keys) {
      const raw = await env.PUSH_STORE.get(name);
      if (!raw) continue;
      const stored: StoredSub = JSON.parse(raw);

      const due = stored.notifications.filter(
        (n) => n.fireAt <= now && n.fireAt > now - window30min,
      );
      const remaining = stored.notifications.filter((n) => n.fireAt > now);

      for (const notif of due) {
        try {
          await webpush.sendNotification(
            stored.subscription,
            JSON.stringify({ title: notif.title, body: notif.body }),
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            // Subscription expired — remove and stop sending to this device
            await env.PUSH_STORE.delete(name);
            break;
          }
        }
      }

      if (due.length > 0) {
        if (remaining.length === 0) {
          await env.PUSH_STORE.delete(name);
        } else {
          await env.PUSH_STORE.put(name, JSON.stringify({ ...stored, notifications: remaining }));
        }
      }
    }
  },
};

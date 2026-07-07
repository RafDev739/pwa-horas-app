interface Env {
  PUSH_STORE: KVNamespace;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_EMAIL: string;
  ADMIN_TOKEN: string;
}

interface ScheduledNotif {
  id: string;
  title: string;
  body: string;
  fireAt: number;
  url?: string;
}

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface StoredSub {
  subscription: { endpoint: string; keys: PushSubscriptionKeys };
  notifications: ScheduledNotif[];
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Base64url helpers ────────────────────────────────────────────────────────

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(str: string): Uint8Array {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const b = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

// ── HKDF via Web Crypto ──────────────────────────────────────────────────────

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8),
  );
}

// ── VAPID JWT (ES256) ────────────────────────────────────────────────────────

async function makeVapidAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string,
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  const enc = new TextEncoder();
  const headerB64 = b64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payloadB64 = b64url(enc.encode(JSON.stringify({ aud: audience, exp: now + 43200, sub: `mailto:${vapidEmail}` })));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Parse uncompressed public key (0x04 || x || y) to get x and y for JWK
  const pubBytes = fromB64url(vapidPublicKey);
  const x = b64url(pubBytes.slice(1, 33));
  const y = b64url(pubBytes.slice(33, 65));

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: vapidPrivateKey, x, y, key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, enc.encode(signingInput)),
  );

  const token = `${signingInput}.${b64url(sig)}`;
  return `vapid t=${token},k=${vapidPublicKey}`;
}

// ── aesgcm payload encryption (draft-ietf-webpush-encryption-04) ─────────────

async function encryptPayload(
  keys: PushSubscriptionKeys,
  payload: string,
): Promise<{ body: Uint8Array; extraHeaders: Record<string, string> }> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Ephemeral sender ECDH key pair
  const senderPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const senderPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', senderPair.publicKey));

  // Receiver public key
  const receiverPub = await crypto.subtle.importKey(
    'raw', fromB64url(keys.p256dh), { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  );

  // ECDH shared secret
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: receiverPub }, senderPair.privateKey, 256),
  );

  const authSecret = fromB64url(keys.auth);
  const uaPub = fromB64url(keys.p256dh);

  // PRK = HKDF(salt=auth_secret, ikm=ecdh_secret, info="Content-Encoding: auth\0", L=32)
  const prk = await hkdf(ecdhSecret, authSecret, enc.encode('Content-Encoding: auth\0'), 32);

  // context = "P-256\0" || uint16be(uaPub.len) || uaPub || uint16be(senderPub.len) || senderPub
  const u16 = (n: number) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, false); return b; };
  const context = concat(enc.encode('P-256\0'), u16(uaPub.length), uaPub, u16(senderPubRaw.length), senderPubRaw);

  // CEK = HKDF(salt=salt, ikm=prk, info="Content-Encoding: aesgcm\0"||context, L=16)
  const cek = await hkdf(prk, salt, concat(enc.encode('Content-Encoding: aesgcm\0'), context), 16);
  // NONCE = HKDF(salt=salt, ikm=prk, info="Content-Encoding: nonce\0"||context, L=12)
  const nonce = await hkdf(prk, salt, concat(enc.encode('Content-Encoding: nonce\0'), context), 12);

  // Padding: uint16be(0) || plaintext
  const padded = concat(new Uint8Array(2), enc.encode(payload));

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded));

  return {
    body,
    extraHeaders: {
      'Content-Encoding': 'aesgcm',
      'Encryption': `salt=${b64url(salt)}`,
      'Crypto-Key': `dh=${b64url(senderPubRaw)}`,
    },
  };
}

// ── Send one push notification ───────────────────────────────────────────────

async function sendPush(
  sub: StoredSub['subscription'],
  notif: ScheduledNotif,
  env: Env,
): Promise<number> {
  const { body, extraHeaders } = await encryptPayload(
    sub.keys,
    JSON.stringify({ title: notif.title, body: notif.body, url: notif.url ?? '/' }),
  );
  const auth = await makeVapidAuthHeader(
    sub.endpoint,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
    env.VAPID_EMAIL,
  );
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      ...extraHeaders,
    },
    body,
  });
  return res.status;
}

// ── Worker handlers ──────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);

    if (url.pathname === '/sync' && request.method === 'POST') {
      const { subscription, notifications } = await request.json<StoredSub>();
      const key = 'sub_' + btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-40);
      await env.PUSH_STORE.put(key, JSON.stringify({ subscription, notifications }));
      return new Response('OK', { status: 200, headers: CORS });
    }

    if (url.pathname === '/schedule-now' && request.method === 'POST') {
      const { subscription, notification } = await request.json<{ subscription: StoredSub['subscription']; notification: ScheduledNotif }>();
      const key = 'sub_' + btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-40);
      const raw = await env.PUSH_STORE.get(key);
      // Reject if not previously registered via /sync, or if endpoint/keys don't match stored record.
      // The p256dh and auth keys are only known to the originating browser, so this guards against
      // notification injection by callers who only know the push endpoint URL.
      if (!raw) return new Response('Forbidden', { status: 403, headers: CORS });
      const stored: StoredSub = JSON.parse(raw);
      if (
        stored.subscription.endpoint !== subscription.endpoint ||
        stored.subscription.keys.auth !== subscription.keys.auth ||
        stored.subscription.keys.p256dh !== subscription.keys.p256dh
      ) {
        return new Response('Forbidden', { status: 403, headers: CORS });
      }
      const others = stored.notifications.filter((n) => n.id !== notification.id);
      await env.PUSH_STORE.put(key, JSON.stringify({ ...stored, notifications: [...others, notification] }));
      return new Response('OK', { status: 200, headers: CORS });
    }

    if (url.pathname === '/test' && request.method === 'POST') {
      if (request.headers.get('Authorization') !== `Bearer ${env.ADMIN_TOKEN}`) {
        return new Response('Unauthorized', { status: 401 });
      }
      const list = await env.PUSH_STORE.list({ prefix: 'sub_' });
      const results: string[] = [];
      for (const { name } of list.keys) {
        const raw = await env.PUSH_STORE.get(name);
        if (!raw) continue;
        const stored: StoredSub = JSON.parse(raw);
        const notif: ScheduledNotif = { id: 'test', title: '✅ Horas — Test', body: 'Push notifications are working!', fireAt: Date.now() };
        try {
          const status = await sendPush(stored.subscription, notif, env);
          results.push(`${name}: HTTP ${status}`);
          if (status === 410 || status === 404 || status === 400) await env.PUSH_STORE.delete(name);
        } catch (err) {
          results.push(`${name}: ERROR ${String(err)}`);
        }
      }
      const body = results.length === 0 ? 'No subscriptions in KV' : results.join('\n');
      return new Response(body, { status: 200, headers: CORS });
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const now = Date.now();
    const window30min = 5 * 60 * 1000;
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
          const status = await sendPush(stored.subscription, notif, env);
          if (status === 410 || status === 404 || status === 400) {
            await env.PUSH_STORE.delete(name);
            break;
          }
        } catch {
          // Network error — skip this notification, retry next cycle
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

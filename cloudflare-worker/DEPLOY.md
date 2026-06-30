# Horas Push Worker — Deployment

## One-time setup

```bash
cd cloudflare-worker
npm install

# Log in to Cloudflare
npx wrangler login

# Create the KV namespace
npx wrangler kv namespace create PUSH_STORE
# → copy the printed id into wrangler.toml: id = "..."

# Store secrets (never committed — use the keys generated during setup)
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_EMAIL

# Deploy
npx wrangler deploy
```

## After deploying

Update `WORKER_URL` in `src/services/notificationService.ts` to the Worker URL
printed by `wrangler deploy` (format: `https://horas-push.<subdomain>.workers.dev`).

## Cron schedule

The Worker runs every 30 minutes (`*/30 * * * *`). Each run checks stored
subscriptions for due notifications and sends them via web-push.

## Local testing

```bash
npx wrangler dev
# Then POST to http://localhost:8787/sync to test
```

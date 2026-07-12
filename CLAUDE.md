# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (http://localhost:5173)
npm run build      # tsc -b && vite build  (fails fast on type errors)
npm run lint       # oxlint
npm run preview    # serve the production build locally
```

There are no tests. Verification is done by running the dev server and using Playwright from `/tmp/playwright-verify/` (installed ad-hoc; not a project dependency).

## Architecture

This is a PWA built with React 18 + Vite + TypeScript. `vite-plugin-pwa` generates a Workbox service worker and `manifest.webmanifest` at build time. All data is static — there is no backend or API.

### Data flow

All domain knowledge lives in `src/data/`:

- **`grid.ts`** — `weeklyGrid[timeSlotIndex][weekdayIndex]` is the 7×7 matrix that maps any (slot, day) pair to a `HoraLetter` (A–G).
- **`timeSlots.ts`** — two arrays of 7 `TimeSlot` objects: `daylightTimeSlots` (starts 1:00 AM, DST) and `standardTimeSlots` (starts 12:00 AM, 1 hour earlier). Slot 6 (G) crosses midnight — DST: 9:34 PM – 1:00 AM, standard: 8:34 PM – 12:00 AM — and requires special range logic.
- **`horaContent.ts`** — full `DetailedHoraContent` for every letter in both languages (`detailedContentEnglish`, `detailedContentSpanish`), plus short `HoraData` summaries (`horaDetailsEnglish`, `horaDetailsSpanish`).
- **`i18n.ts`** — all UI strings. The `t(lang, key)` function is the single translation call site; `TranslationKey` is a union type that enforces exhaustiveness at compile time. Adding a string requires updating both the union and both `en`/`es` objects.
- **`activitySearch.ts`** — keyword map (`ACTIVITY_KEYWORDS`) and `searchActivity(category)` for the Ask screen. Maps all 30 `TaskCategory` values to keyword arrays that are matched as case-insensitive substrings against bullet lines in `detailedContentEnglish`. Returns `{ good, bad, mixed, neutral }` arrays of `HoraLetter`. Also exports `CATEGORY_DISPLAY_GROUP`, `CATEGORIES_BY_GROUP`, and `ALL_CATEGORIES` for rendering the category grid. No AI — pure string matching against static data.

### Runtime calculation

`src/services/horaCalculator.ts` is the only place that reads `new Date()`. It selects the correct slot array (DST vs standard via offset comparison), finds the current slot index (handling the midnight-crossing slot), and returns a `CurrentPeriod` object `{ letter, slotIndex, weekdayIndex }`.

`isDaylightSavingTime()` compares Jan vs Jul timezone offsets using `Math.max` (not `Math.min`) — DST offsets are numerically smaller (e.g. UTC-4 = 240 min vs UTC-5 = 300 min), so the current offset not equalling the maximum means we are in DST.

`useCurrentPeriod` (hook) wraps this in a `setInterval` that re-runs every 60 seconds.

### State and persistence

All user preferences are managed by `useSettings` and serialised as a single JSON object under `localStorage` key `horas_settings`. The `Settings` interface in `src/types/index.ts` is the schema. `useLanguage` persists separately under `horas_language`.

### Notifications

There are two notification delivery paths:

**Foreground (app open):** `src/services/notificationService.ts` stores scheduled records in IndexedDB (`horas-notifications`) via the `idb` package. `startNotificationPolling()` runs a 30-second interval that fires due notifications via `new Notification()`.

**Background (app closed):** A Cloudflare Worker (`cloudflare-worker/`) delivers push notifications via Apple Push Notification service (APNs) when the app is not running.

- `subscribeToPush(settings, lang)` in `notificationService.ts` creates a Web Push subscription and POSTs it along with the scheduled notification list to `POST /sync` on the Worker. It detects VAPID key changes (stored under `horas_vapid_pub` in localStorage) and forces a fresh subscription when the key rotates.
- The Worker stores each subscription in **Cloudflare KV** (`PUSH_STORE`) keyed by an endpoint hash.
- A cron trigger (`*/5 * * * *`) runs `scheduled()` every 5 minutes, checks for notifications due within the past 5-minute window, and sends them via Web Push.
- Encryption uses the `aesgcm` scheme (draft-ietf-webpush-encryption-04) implemented with the native Web Crypto API (`crypto.subtle`) — no npm dependencies. VAPID JWT signing uses ES256 via `crypto.subtle.sign`. The `web-push` npm package does **not** work in the Cloudflare Workers runtime.
- VAPID public key and email are plain vars in `cloudflare-worker/wrangler.toml`; only `VAPID_PRIVATE_KEY` is a Wrangler secret. `VITE_VAPID_PUBLIC_KEY` in `.env` must match.
- Subscriptions returning 400/404/410 are automatically deleted from KV.
- A bearer-token-protected `POST /test` endpoint sends an immediate push to all subscriptions in KV (for testing without waiting for the cron).

**Notification tap flow:** The service worker's `notificationclick` handler appends `?_nt=<title>&_nb=<body>` to the target URL. `NotificationBanner` (`src/components/NotificationBanner.tsx`) reads these params on mount, shows a dismissible banner, and strips the params from the URL. Tap URLs are validated to same-origin paths only. Favorite period notifications navigate to `/period/:letter` on tap; daily forecast notifications navigate to `/`.

### Routing

Four routes, all in `src/App.tsx`:

| Route | Component |
|---|---|
| `/` | `HoraGrid` — the main 7×7 grid |
| `/ask` | `AskView` — activity lookup screen |
| `/period/:letter` | `HoraDetailView` — expandable sections for one period |
| `/day/:weekday` | `WeekdayDetailView` — all 7 slots for one weekday index (0=Sunday) |

Settings is a modal overlay rendered inside `App`, not a route. A `BottomNav` component (also in `App.tsx`) renders a fixed two-tab bar (Grid / Ask) only when the pathname is `/` or `/ask`; it is hidden on detail views.

### Ask About Hours screen

`src/components/AskView.tsx` is the activity lookup screen. It shows 30 activity categories (sourced from the existing `TaskCategory` type) in a filterable, group-tabbed tile grid. Tapping a tile calls `searchActivity()` and displays a results panel with colored hour badges grouped as Good / Avoid / Mixed / Not Mentioned. Each badge navigates to `/period/:letter`. The five display groups are `business`, `medical`, `legal`, `travel`, and `other` (defined in `activitySearch.ts` as `AskDisplayGroup`). Keyword matching always runs against English content (`detailedContentEnglish`) regardless of the active language; display names and group labels use the active language via `t()`.

### Styling

Each component has a co-located `.module.css` file. Global design tokens are CSS custom properties declared in `src/styles/global.css` (e.g. `--accent-orange: #E98520`, `--primary-dark-navy: #062134`). The TypeScript mirror lives in `src/styles/colors.ts` for use in inline styles. Cell background color is a single constant (`#0C499C`) in `HoraCellView.tsx`; only the current-period cell uses `--accent-orange`.

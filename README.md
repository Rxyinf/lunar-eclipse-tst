# lunar-eclipse-tst

Minimal live tracker for the **28 August 2026 partial lunar eclipse** (night of 27–28 Aug in Texas). Dark, mobile-first, one screen. Science only — no astrology.

There is **no totality**. At greatest eclipse the umbral magnitude is **0.93187** (~96% of the disk inside Earth umbra), leaving a bright sliver on a copper-red Moon.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No Stripe keys are required: a clearly labeled **TEST unlock** enables the live tracker with no charge.

```bash
npm run build
```

## Location and time

- Default viewer zone: `America/Chicago` (CDT in August).
- Geolocation is requested in the browser. If denied or unavailable, the app uses **Austin, TX** (30.2672, −97.7431).
- Coordinates in far west Texas (El Paso / Hudspeth, west of ~104.05°W) use `America/Denver` (MDT).

## Eclipse contacts (UTC, hardcoded)

Source of truth: Fred Espenak / NASA GSFC lunar eclipse catalog (EclipseWise). Cross-checked with timeanddate.com and NASA SVS 5672.

| Contact | UTC (28 Aug 2026) | CDT |
| --- | --- | --- |
| Penumbral begins (P1) | 01:23:32 | 8:23:32 pm, 27 Aug |
| Partial begins (U1) | 02:33:25 | 9:33:25 pm, 27 Aug |
| Greatest | 04:12:55 | 11:12:55 pm, 27 Aug |
| Partial ends (U4) | 05:52:13 | 12:52:13 am, 28 Aug |
| Penumbral ends (P4) | 07:02:03 | 2:02:03 am, 28 Aug |

Penumbral: Moon in the outer, partial shadow — faint shading. Partial: Moon in the dark umbra — a growing copper bite. Greatest: maximum coverage, still not total. Then the sequence reverses.

Next lunar eclipse teaser: **20 February 2027**, penumbral.

## Subscription — $2.99 / week

- **Free:** static contact list + still / low-motion 3D preview of the current or next stage.
- **Paid:** live clock, full 3D animation, scrubbable timeline, countdown. Cancel anytime via Stripe Customer Portal.
- Copy is only **$2.99 / week**. No fake scarcity or extra fees in UI.

### Stripe test setup

1. Create a Product in the Stripe Dashboard.
2. Add a **recurring Price**: USD **2.99** / **week**.
3. Copy the Price id (`price_...`) into `STRIPE_PRICE_ID`.
4. Copy test secret and publishable keys, plus a webhook signing secret if you listen for events.
5. Duplicate `.env.example` to `.env.local` (never commit secrets):

```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

6. Webhook endpoint: `POST /api/webhook` (events: `checkout.session.completed`, `customer.subscription.deleted`). Checkout success also confirms the session and sets an httpOnly cookie so refresh stays unlocked in test.
7. If those keys are missing, the app shows **TEST unlock** instead of Checkout. It never fakes a real charge.

## Stack

Next.js (App Router) · TypeScript · Three.js / @react-three/fiber / @react-three/drei · Stripe Checkout

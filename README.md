# MOSCOW

Premium streetwear e-commerce, built around cold-weather architecture and honest sizing.

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · React Three Fiber · GSAP · Zustand · Supabase-ready

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No configuration is needed to run locally. On first boot the app creates
`data/mosco.json`, seeds the catalogue, the eight collections, store settings and
an administrator account, and runs entirely from that file.

**Default admin:** `admin@moscow.store` / `MoscowAdmin!2026` → <http://localhost:3000/admin>
**Change this password before going live.** Override it with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
before the first boot, or change it from the dashboard afterwards.

```bash
npm run build        # production build
npm start            # serve the production build
npm run fit:test     # exercise the Fit AI engine against the real catalogue
```

---

## Architecture

### Two databases, one interface

Everything goes through a single `Repo` interface (`lib/db/repo.ts`) with two
interchangeable implementations:

| Adapter | When it is used | Where data lives |
| --- | --- | --- |
| `lib/db/local.ts` | default | `data/mosco.json` |
| `lib/db/supabase-repo.ts` | when `NEXT_PUBLIC_SUPABASE_URL` **and** `SUPABASE_SERVICE_ROLE_KEY` are both set | your Supabase project |

`db()` in `lib/db/index.ts` picks one at startup. Pages, API routes and the admin
dashboard are written once and run unchanged against either. Switching backends
is an environment change and a restart — there is no code to edit.

### Switching to Supabase

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
   It creates the tables, indexes, the atomic `mosco_decrement_stock()` function,
   the `mosco-media` storage bucket, and locks everything down with RLS.
2. Copy `.env.example` → `.env.local` and fill in the three Supabase values.
3. Restart. The admin dashboard's sidebar badge flips from **Local DB** to **Supabase**.

### Security model

- **RLS is deny-by-default.** Every table has Row Level Security enabled with *no*
  policies for `anon` or `authenticated`, and the default grants are revoked. The
  browser never talks to the database; all access is server-side with the
  service-role key.
- `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix, so Next.js cannot bundle
  it into client JavaScript. `lib/supabase/env.ts` is never imported by a
  `"use client"` module.
- Sessions are HTTP-only, signed JWTs (`jose`, HS256, 30 days). `AUTH_SECRET` is
  **required in production** — the app throws at startup without it.
- Passwords are salted `scrypt` hashes.
- Every admin mutation passes through `adminGuard()` (`lib/auth/api-guard.ts`)
  server-side. Admin pages additionally redirect via `requireAdmin()`.
- Orders are re-priced from the database on submission — prices, stock and
  discount codes sent by the client are ignored.
- Order tracking requires the order number **and** the phone number on the order.

---

## What is where

```
app/
  page.tsx                  homepage — 3D hero, collections, story, newsletter
  shop/                     catalogue with filters, sorting, search
  collections/[slug]/       category + curated collection pages
  product/[slug]/           gallery, Fit AI, size chart, purchase panel
  cart/  checkout/          cart, checkout, COD + InstaPay
  order/[number]/           order confirmation
  track/                    public order tracking (number + phone)
  account/                  login, register, orders, wishlist, addresses, profile
  admin/(protected)/        dashboard — products, collections, orders, customers,
                            discounts, homepage content, messages, settings
  api/                      all mutations; admin routes gated by adminGuard()
components/
  three/                    HeroScene, IceCity, Snow — homepage only
  product/                  gallery, FitAi, SizeChart, purchase panel
  admin/                    product editor, image uploader, managers
lib/
  db/                       types, repo interface, both adapters, query helpers
  fit/engine.ts             MOSCOW Fit AI
  auth/  i18n/  media/      sessions, bilingual copy, image storage
supabase/schema.sql         full migration + RLS + storage + seed
scripts/fit-test.mts        Fit AI regression harness
```

---

## MOSCOW Fit AI

Three questions — height & weight, body shape, preferred fit — scored against
**that product's own measurement chart**. There is deliberately no universal chart.

How a recommendation is produced:

1. Estimate the body from height, weight and shape.
2. Find the **anchor size**: the size whose published height/weight ranges best
   contain this customer. That is the brand's own intent for them.
3. Target = the anchor garment's measurement, shifted by the difference between
   the customer's chosen fit and a regular fit. "Regular" therefore lands exactly
   on the brand's grading; slim and oversized step relative to it.
4. Score every size against the target, penalising tight fits more heavily than
   loose ones, and demoting out-of-stock sizes.
5. If the product publishes no body ranges, fall back to absolute ease and cap
   confidence at medium. If it has no measurements at all, say so plainly rather
   than guess.

`high` confidence requires the customer to sit inside a published range *and* the
chosen size to land within tolerance. It never auto-adds to the cart — the
shopper selects the size themselves.

Tune the ease targets, tolerance, confidence display and disclaimer in
**Admin → Settings → Fit AI**. Per-product charts and body ranges live in
**Admin → Products → Sizes & chart / Fit AI**.

```bash
npm run fit:test
```

Runs the engine over the real catalogue: six personas per product, a
no-measurement product, and a 50→120 kg monotonicity sweep.

---

## Product imagery

Uploads are re-encoded to WebP and bounded in size — nothing else. Colour, cut,
stitching and detail are never altered, and no product is ever represented by a
generated or rendered image. The 3D work on the homepage is an architectural
environment; it contains no garments.

Images are written to `public/uploads/` locally, or the `mosco-media` Supabase
bucket when configured. The same `/api/upload` route handles both.

---

## Internationalisation

English and Arabic, with full RTL. The locale lives in a cookie; server components
read it with `getLocale()`, client components with `useI18n()`. Copy lives in
`lib/i18n/dictionaries.ts`; database content carries `_ar` columns that the admin
can fill in per product, collection, banner and setting.

---

## Environment

See [`.env.example`](.env.example). Everything is optional locally; `AUTH_SECRET`
is mandatory in production.

---

## Known gaps

- Supabase is wired and migrated but has not been run against a live project from
  this workspace — no credentials were available. The local adapter is fully
  exercised.
- `public/brand/` is empty. Drop in an OG share image and favicons when the brand
  assets are ready.
- Transactional email (order confirmations) is not wired to a provider; orders are
  confirmed on-screen and in the admin dashboard.

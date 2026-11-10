# ZOOM X — Headless Storefront

Next.js storefront for ZOOM X (Capital Wills Holdings (Pvt) Ltd), backed by WordPress + WooCommerce as the single source of truth for products, prices, stock, customers and orders.

> **Status:** Phase 4 (homepage) complete. WooCommerce is **not yet installed** on zoomx.lk — see [docs/PHASE-1-AUDIT.md](docs/PHASE-1-AUDIT.md) for blockers and required client inputs.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components) · React 19 · TypeScript |
| Styling | Tailwind CSS 4 (PostCSS) · Inter via `next/font` |
| UI | Framer Motion · Lucide React |
| Forms | React Hook Form · Zod |
| Client UI state | Zustand (cart contents live in WooCommerce, never localStorage) |
| Tests | Vitest 3 + React Testing Library · Playwright |
| Hosting | Vercel (frontend) · existing WordPress host (backend) |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you have; all integrations are optional until provisioned
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (webpack) |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` · `typecheck` | ESLint · `tsc --noEmit` |
| `npm test` · `test:watch` | Vitest unit/component tests |
| `npm run test:e2e` | Playwright (desktop + mobile Chromium); builds and starts the app automatically |

First-time Playwright setup: `npx playwright install chromium`.

### Why webpack instead of Turbopack

The development machine has **Windows Smart App Control** enabled, which blocks unsigned native binaries (`@next/swc-win32-x64-msvc`, Turbopack, Vite 8's rolldown). Next.js falls back to WASM SWC, which works with webpack but not Turbopack. For the same reason the project uses Vitest 3 (esbuild/Rollup) rather than Vitest 5.

Scripts pass `--webpack` so local and Vercel builds use the same bundler. Once development happens on a machine without that policy, removing `--webpack` from `package.json` re-enables Turbopack with no other changes (Tailwind is configured via `postcss.config.mjs`, which both bundlers read).

## Project structure

```
src/
  app/                 Routes (App Router). api/ = server route handlers (BFF to WooCommerce)
  components/
    layout/ home/ products/ cart/ checkout/ account/ ui/
  services/
    woocommerce/       Store API + REST v3 clients (server-only)
    payments/          PayHere / WEBXPAY signing + verification (server-only)
    shipping/
  hooks/ store/        Client hooks · Zustand UI stores
  lib/                 env.ts (validated server env), site.ts (public business config)
  types/ utils/        Shared types · pure helpers (e.g. currency formatting)
tests/
  unit/                Vitest
  e2e/                 Playwright
docs/                  Audit, architecture and handover documentation
```

## Environment

All variables are documented in [`.env.example`](.env.example). Rules:

- Only `NEXT_PUBLIC_*` variables reach the browser; no secret ever uses that prefix.
- `src/lib/env.ts` validates server variables with Zod (`server-only` — importing it from a client component fails the build). Error messages name the variable, never its value.
- Integration secrets are optional at boot; code that needs one calls `requireEnv(...)`, which throws `MissingConfigurationError` instead of falling back to fake data or simulated payments.
- `PAYHERE_MODE` / `WEBXPAY_MODE` select sandbox vs live. Use sandbox values in Vercel Preview and live values only in Production.
- `.env*` is git-ignored except `.env.example`.

## Architecture (summary)

The browser talks only to Next.js. Server Components read the public WooCommerce Store API with cache tags; route handlers proxy cart/checkout calls, keeping WooCommerce's `Cart-Token` in an HttpOnly cookie. WooCommerce webhooks (HMAC-verified) revalidate cached catalogue data. Order totals, stock and payment status always come from WooCommerce/the gateway — never from the client. Full detail: [docs/PHASE-1-AUDIT.md §6](docs/PHASE-1-AUDIT.md).

## Phase log

| Phase | Status |
|---|---|
| 1 Research & audit | ✅ [docs/PHASE-1-AUDIT.md](docs/PHASE-1-AUDIT.md) |
| 2 Foundation | ✅ Next.js, TS, Tailwind, Inter, env validation, security headers, Vitest, Playwright, Git |
| 3 Design system | ✅ Tokens, type scale, buttons, layout primitives, header (desktop flyout, search, mobile menu), footer, announcement bar, 404 — [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) |
| 4 Homepage | ✅ Hero, range/categories, best sellers, business campaign, brand story, featured, why ZOOM X — see "Homepage content" below |
| 5 Catalogue | Next — shop, category and product pages (needs a staging WooCommerce to test against real data) |
| 6–11 | Pending — blocked on WooCommerce installation |

## Homepage content

Copy lives in [`src/content/home.ts`](src/content/home.ts), taken from the current zoomx.lk pages. **It needs client approval before launch.**

| Section | Source | Behaviour without WooCommerce |
|---|---|---|
| Hero | zoomx.lk tagline + intro | Typographic. Set `heroImage` once a real packshot is approved (the AI renders on zoomx.lk have garbled label text, so they aren't used). |
| Shop by category | Live Store API categories | Falls back to the 10 product names from zoomx.lk/products, each linking to a shop search |
| Best sellers / Featured | Store API (`orderby=popularity`, `featured=true`) | Hidden |
| Campaign | zoomx.lk/for-businesses | Always shown |
| Brand story / Why ZOOM X | zoomx.lk/about-us, home "Why We Care" | Always shown |
| Testimonials | — | Omitted until verified reviews exist |
| Newsletter | — | Omitted until an email provider is chosen |

Left out on purpose, pending evidence: "99.9% germ kill", "dermatologically tested and certified", "food-contact certified" and "phosphate/paraben free".

Catalogue data comes from [`src/services/woocommerce/catalog.ts`](src/services/woocommerce/catalog.ts). Reads are cached for hours and tagged `products` and `categories` for webhook revalidation (Phase 6). Responses are validated with Zod. If WooCommerce is unconfigured or down, product sections are hidden rather than breaking the page. Product names are decoded to plain text and never rendered as HTML.

## Business data policy

Product details, prices, claims, certifications, reviews and policies are never invented. Unknown business details are `null` in `src/lib/site.ts` and hidden in the UI until the client supplies them.

## Local WooCommerce sandbox

zoomx.lk has no WooCommerce yet, so development runs against a throwaway local store: [WordPress Playground](https://wordpress.github.io/wordpress-playground/) (PHP compiled to WebAssembly, so no Docker, PHP install or native binaries are needed).

```bash
npm run sandbox          # http://127.0.0.1:9400 — WooCommerce + seeded test catalogue (first boot downloads WP + WooCommerce)
```

Then in `.env.local`: `WOOCOMMERCE_STORE_URL=http://127.0.0.1:9400`.

- [`sandbox/seed.php`](sandbox/seed.php) creates **placeholder data only**: everything is named "Sandbox…", and all prices, SKUs and stock are invented. It covers simple, variable, on-sale, low-stock and out-of-stock products, three categories, LKR currency, Sri Lanka only, Cash on Delivery, a sandbox flat-rate shipping method and the coupon `SANDBOX10`.
- The store is in memory: stopping it discards all changes, and the next start re-seeds it.
- Admin: http://127.0.0.1:9400/wp-admin — Playground default login `admin` / `password` (sandbox only). Auto-login is deliberately off: it redirects cookieless requests, which breaks server-side fetches.
- WordPress is pinned to 7.1.3 in `sandbox/blueprint.json` so it boots from the local Playground cache (`~/.wordpress-playground`); bump it when needed.
- Never point production at the sandbox. Swap the URL for the real store once it exists.

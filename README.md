# ZOOM X — Headless Storefront

Next.js storefront for ZOOM X (Capital Wills Holdings (Pvt) Ltd), backed by WordPress + WooCommerce as the single source of truth for products, prices, stock, customers and orders.

> **Status:** Phase 2 (foundation) complete. WooCommerce is **not yet installed** on zoomx.lk — see [docs/PHASE-1-AUDIT.md](docs/PHASE-1-AUDIT.md) for blockers and required client inputs.

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
| 3 Design system | Next |
| 4–11 | Pending — 6+ blocked on WooCommerce installation |

## Business data policy

Product details, prices, claims, certifications, reviews and policies are never invented. Unknown business details are `null` in `src/lib/site.ts` and hidden in the UI until the client supplies them.

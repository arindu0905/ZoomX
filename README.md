# ZOOM X — Headless Storefront

Next.js storefront for ZOOM X (Capital Wills Holdings (Pvt) Ltd), backed by WordPress + WooCommerce as the single source of truth for products, prices, stock, customers and orders.

> **Status:** Phases 1–10 complete; Phase 11 (deployment) is prepared — guides and CI are ready, waiting on access. PayHere still waits on sandbox credentials, developed against the local WooCommerce sandbox. WooCommerce is **not yet installed** on zoomx.lk — see [docs/PHASE-1-AUDIT.md](docs/PHASE-1-AUDIT.md) for blockers and required client inputs.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components) · React 19 · TypeScript |
| Styling | Tailwind CSS 4 (PostCSS) · Inter via `next/font` · apple.com-style look ([docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)) |
| UI | Framer Motion · Lucide React |
| Forms | React Hook Form · Zod |
| Client UI state | Zustand (cart contents live in WooCommerce, never localStorage) |
| Tests | Vitest 3 + React Testing Library · Playwright |
| Hosting | Vercel (frontend) · existing WordPress host (backend) |

## Documentation

| Document | For |
|---|---|
| [docs/PHASE-1-AUDIT.md](docs/PHASE-1-AUDIT.md) | Original audit, blockers, architecture |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Tokens, type, components |
| [docs/WOOCOMMERCE-INTEGRATION.md](docs/WOOCOMMERCE-INTEGRATION.md) | Store API, sessions, webhooks, accounts |
| [docs/PAYMENT-CONFIGURATION.md](docs/PAYMENT-CONFIGURATION.md) | Cash on Delivery, PayHere, WEBXPAY status |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | WordPress prep, Vercel, DNS, go-live and rollback |
| [docs/CLIENT-HANDOVER.md](docs/CLIENT-HANDOVER.md) | Plain-language guide for the ZOOM X team and the list of inputs still needed |

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
| 5 Catalogue | ✅ Shop, category and product pages, filters, sorting, pagination, search + suggestions, variations — see "Catalogue" below |
| 6 WooCommerce integration | ✅ Session-aware cart client (signed HttpOnly `Cart-Token` cookie), cart API, signed webhooks + manual revalidation — [docs/WOOCOMMERCE-INTEGRATION.md](docs/WOOCOMMERCE-INTEGRATION.md) |
| 7 Cart & checkout | ✅ Bag drawer + page, quantities, coupons, delivery options, checkout (Sri Lanka address, Cash on Delivery), order confirmation — see "Cart & checkout" below |
| 8 Payments | ✅ Cash on Delivery; PayHere built and verified with test values (signed form, verified notifications, amount check, idempotent order updates). Needs real sandbox credentials for an end-to-end payment. WEBXPAY awaiting business confirmation — [docs/PAYMENT-CONFIGURATION.md](docs/PAYMENT-CONFIGURATION.md) |
| 9 Customer accounts | ✅ Register, sign in/out, password reset, dashboard, order history and details, profile and address, guest order tracking — [docs/WOOCOMMERCE-INTEGRATION.md §7](docs/WOOCOMMERCE-INTEGRATION.md) |
| 10 Optimisation | ✅ Content and draft policy pages, sitemap, robots, Organization data, CSP and HSTS, axe accessibility scan (no violations), performance budget — see "Optimisation" below |
| 11 Deployment | 🟡 Prepared: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/CLIENT-HANDOVER.md](docs/CLIENT-HANDOVER.md) and GitHub Actions CI. Waiting on WordPress/WooCommerce hosting, Vercel, DNS and PayHere access |

## Homepage content

Copy lives in [`src/content/home.ts`](src/content/home.ts), taken from the current zoomx.lk pages. **It needs client approval before launch.**

| Section | Source | Behaviour without WooCommerce |
|---|---|---|
| Hero | zoomx.lk tagline + intro, apple.com-style line-up of best-seller packshots | Typographic. Set `heroImage` once a real packshot is approved (the AI renders on zoomx.lk have garbled label text, so they aren't used). |
| Shop by category | Live Store API categories | Falls back to the 10 product names from zoomx.lk/products, each linking to a shop search |
| Product tiles | apple.com-style tiles: featured products full-width, then best sellers two-up, each with Learn more / Buy | Hidden |
| The full range | Best-seller card carousel | Hidden |
| Campaign | zoomx.lk/for-businesses | Always shown |
| Brand story / Why ZOOM X | zoomx.lk/about-us, home "Why We Care" | Always shown |
| Testimonials | — | Omitted until verified reviews exist |
| Newsletter | — | Omitted until an email provider is chosen |

Left out on purpose, pending evidence: "99.9% germ kill", "dermatologically tested and certified", "food-contact certified" and "phosphate/paraben free".

Catalogue data comes from [`src/services/woocommerce/catalog.ts`](src/services/woocommerce/catalog.ts). Reads are cached for hours and tagged `products` and `categories` for webhook revalidation (Phase 6). Responses are validated with Zod. If WooCommerce is unconfigured or down, product sections are hidden rather than breaking the page. Product names are decoded to plain text and never rendered as HTML.

## Editable site content

The ZOOM X team edits the announcement bar and homepage copy in WordPress, at **ZOOM X → Site content**, without a developer. This comes from the `zoomx-headless-payments` plugin, v1.2 (`includes/content.php`).

- Fields: announcement (or hide it), top banner, For businesses, Our story (paragraphs + 4 values), Why ZOOM X (4 reasons). **An empty field keeps the built-in copy** from `src/content/home.ts`.
- WordPress serves it read-only at `GET /wp-json/zoomx/v1/content`. The storefront validates it with Zod, merges it over the defaults (`src/services/wordpress/content.ts`), caches it for hours under the `content` tag, and falls back to the defaults if WordPress is down.
- **Save** calls `POST /api/content/refresh` on the storefront, signed with the same shared secret as customer sign-in (`ZOOMX_HEADLESS_SECRET` = `WORDPRESS_AUTH_SECRET`), so changes appear immediately. If that call fails, the change still appears within an hour.
- Links accept only site paths (`/shop`) or http(s) URLs, and all text is plain (no HTML).
- **Pages** (**ZOOM X → Pages**, `includes/pages.php`): About, Sustainability, For businesses, FAQs, and the Delivery, Returns, Privacy and Terms policies. Each page has a title, search description, small heading, headline, Draft/Approved status and a plain-text body (`## Heading`, `- bullet`, blank line between paragraphs). The editor is pre-filled from `GET /api/content/pages` (the built-in text). Only fields that differ from the built-in text are stored, and **Restore standard text** removes them. Approved pages lose the Draft notice and `noindex` and join the sitemap. Served at `GET /wp-json/zoomx/v1/pages` and merged in `src/services/wordpress/pages.ts`.
- Still in code: the Contact page (it uses the business details in `src/lib/site.ts`). Product data lives in WooCommerce.

## Admin dashboard (`/admin`)

A Shopify-style back office built in Next.js, so the ZOOM X team never needs to open WordPress. WooCommerce stays the engine behind it: stock, order emails, payments and the database.

| Screen | Create | Read | Update | Delete |
|---|---|---|---|---|
| Home | Quick links: create order, add product, new discount | Orders and sales (30 days), waiting to be packed, recent orders, low stock | — | — |
| Orders | Manual orders (phone / WhatsApp / walk-in): pick products, qty, address, payment, delivery charge. WooCommerce prices and totals them and reduces stock | List, filter by status, search, order detail | Status, customer and delivery details, customer note, private or customer-emailed notes | Order (to trash, restorable 30 days), notes |
| Products | Single products or products with options (e.g. Fragrance: Lemon, Lavender), with photo upload | List, search, filter by stock or category | Name, descriptions, price, sale price, stock, SKU, categories, photos (add / remove / main), status, featured. Per option: price, sale, stock; add new options | Product (to trash), individual options |
| Categories | Name, description, photo | List with product counts | Name, description, photo | Category (products are kept) |
| Customers | Account (WooCommerce emails them a set-password link) | List, search, detail with their orders | Name, email, phone, address | Account (past orders kept) |
| Discounts | % or LKR off, minimum spend, expiry, max uses, free delivery | List with usage | All fields | Code |
| Site content / Pages | — | Current text | Homepage text, announcement, content pages | Restore standard text |

Deletes ask for confirmation. Errors show WooCommerce's own reason (e.g. "Invalid or duplicated SKU."). Photos are JPG/PNG/WebP up to 5 MB, checked by content (not file name) in the plugin's signed `admin/media` endpoint.

**How it works**
- **Sign in:** staff use their WordPress login. Only users who can manage WooCommerce (Shop manager or Administrator) are accepted, checked by the plugin's signed `auth/staff-login` endpoint. Customers can't sign in here, and staff can't sign in to the storefront account area.
- **Session:** `zx_admin` cookie: HttpOnly, SameSite=Strict, 8 hours, signed with a key separate from the customer session. Staff status is re-checked with WordPress (`admin/staff`) once per request (React `cache()`), and a successful check is remembered for 60 seconds per server instance. Removing someone's role therefore locks them out within a minute.
- **Caching:** admin reads are cached for up to 60 s under the `admin` tag (`src/services/admin/woo.ts`). Every admin save, every storefront checkout and every WooCommerce webhook (orders, products, customers, coupons) clears it, so staff always see changes. The dashboard streams each section behind its own placeholder. Measured on a production build against the local sandbox: first dashboard visit ~2.6 s, repeat visits ~0.35 s.
- **Speed:** in a production build the admin's own work is ~0.35 s per page. Screens that read shop data also wait on WooCommerce: ~1.7–2 s per call in the local WebAssembly sandbox, typically 0.2–0.5 s on normal hosting. `next dev` adds 1–2 s more on top.
- **Saving:** every change is a Server Action (`src/app/admin/actions.ts`) that re-checks the staff member, validates with Zod, and saves through WooCommerce REST v3 (`src/services/admin/woo.ts`) or the plugin's signed `admin/content` / `admin/page` endpoints. The storefront cache is then refreshed, so changes show on the website immediately.
- **Layout:** the storefront lives in the `src/app/(shop)` route group (same URLs), and the admin has its own frame. `/admin` renders per request (`instant = false`), is `noindex`, and is disallowed in robots.txt.
- **Not in the dashboard yet:** gateway refunds, staff accounts, delivery zones/rates and tax settings, and restoring items from the trash. These stay in WordPress → WooCommerce.
- **Local sandbox:** sign in at http://localhost:3000/admin with `admin` / `password` (sandbox only).

## Business data policy

Product details, prices, claims, certifications, reviews and policies are never invented. Unknown business details are `null` in `src/lib/site.ts` and hidden in the UI until the client supplies them.

## Local WooCommerce sandbox

zoomx.lk has no WooCommerce yet, so development runs against a throwaway local store: [WordPress Playground](https://wordpress.github.io/wordpress-playground/) (PHP compiled to WebAssembly, so no Docker, PHP install or native binaries are needed).

```bash
npm run sandbox          # http://127.0.0.1:9400 — WooCommerce + seeded test catalogue (first boot downloads WP + WooCommerce)
```

The sandbox also mounts `wordpress-plugin/zoomx-headless-payments` (the headless PayHere payment method) and enables it.

Then in `.env.local`: `WOOCOMMERCE_STORE_URL=http://127.0.0.1:9400`, plus the three values from `sandbox/.rest-keys.env` (`WOOCOMMERCE_CONSUMER_KEY` / `_SECRET`, `WORDPRESS_AUTH_SECRET`). That file is created on the first `npm run sandbox`, is git-ignored, and stays the same across restarts.

- [`sandbox/seed.php`](sandbox/seed.php) loads the **real ZOOM X range** from [`sandbox/catalogue/products.json`](sandbox/catalogue/products.json): the 10 products on zoomx.lk/products (Air Freshener as one variable product with Cinnamon and Green Apple), their sizes, features and packshots (`sandbox/catalogue/images/`), in the six proposed categories. **Prices, SKUs (`SBX-…`) and stock are sandbox-only placeholders** — zoomx.lk publishes none — chosen to cover sale, low-stock, out-of-stock and variable states for the e2e suite. Also: LKR, Sri Lanka only, Cash on Delivery, a sandbox flat-rate shipping method and the coupon `SANDBOX10`.
- Unverified claims from zoomx.lk ("biodegradable", "dermatologically / lab tested and certified") are left out of the copy and listed per product under `withheldClaims`.
- **Real store import:** `node scripts/catalogue-csv.mjs` writes [`docs/zoomx-products-import.csv`](docs/zoomx-products-import.csv) for WooCommerce → Products → Import. Products import as drafts with prices, SKUs and stock blank; images are fetched from the existing zoomx.lk media.
- WooCommerce 11.2 under Playground/SQLite rejects every stock-managed product at checkout during its "hold stock" reservation. The seed adds a sandbox-only mu-plugin that skips that reservation (`woocommerce_hold_stock_for_checkout`); stock is still checked and reduced when the order is placed.
- next/image normally refuses private IPs; `next.config.ts` allows it only when `WOOCOMMERCE_STORE_URL` is on loopback (the sandbox).
- The store is in memory: stopping it discards all changes, and the next start re-seeds it.
- Admin: http://127.0.0.1:9400/wp-admin — Playground default login `admin` / `password` (sandbox only). Auto-login is deliberately off: it redirects cookieless requests, which breaks server-side fetches.
- WordPress is pinned to 7.1.3 in `sandbox/blueprint.json` so it boots from the local Playground cache (`~/.wordpress-playground`); bump it when needed.
- The sandbox folder is mounted at `/zoomx-sandbox`, outside the WordPress web root, so the keys file can't be fetched over HTTP. A sandbox-only mu-plugin lets WooCommerce accept REST Basic auth over plain HTTP on 127.0.0.1. **Never** do this on a real site: production must use HTTPS.
- Never point production at the sandbox. Swap the URL for the real store once it exists.

## Catalogue (Phase 5)

| Route | Rendering | Notes |
|---|---|---|
| `/shop` | Static shell + streamed results | `?search`, `?category`, `?sort` (`popularity`, `newest`, `price-asc`, `price-desc`), `?min`/`?max` (whole LKR), `?page` (12 per page) |
| `/category/[slug]` | Prerendered for live categories, others on demand | Name, description, image, breadcrumbs, same filters |
| `/product/[slug]` | Top 24 best sellers prerendered, others on demand | Gallery, price/sale, SKU, sizes, stock, quantity, specs, related products, Product + Breadcrumb JSON-LD |
| `/api/search?q=` | Dynamic, CDN-cacheable 60s | Header suggestions (products + matching categories) |

- **Query parsing**: [`src/lib/catalog-query.ts`](src/lib/catalog-query.ts) validates every URL param with Zod and drops anything malformed rather than erroring. Rupees in the URL are converted to the Store API's minor units.
- **Filters** are a plain GET form (works without JavaScript); `next/form` makes submissions client-side navigations. Empty fields and the default sort are left out of the URL.
- **Variations**: [`src/lib/variations.ts`](src/lib/variations.ts) matches selections to WooCommerce variations, including "any" values and taxonomy slugs. Out-of-stock sizes are shown crossed out and can't be bought. Each variation's own price, SKU and stock comes from the Store API. WooCommerce re-checks all of it at add-to-cart.
- **Descriptions** from WooCommerce are rendered as plain-text paragraphs, never as raw HTML.
- **Caching**: product lists and product detail are cached for minutes, categories for hours. All reads are tagged `products` / `categories` / `product:<id>` for webhook revalidation in Phase 6.
- **Sorting note**: WooCommerce sorts a variable product by its highest price for "high to low" and its lowest for "low to high".
- **Header**: only the pathname-dependent pieces (active link, close-on-navigate) are inside `<Suspense>`, so the header is interactive immediately and pages can be re-rendered on demand after revalidation.
- **Add to bag** is shown disabled ("Online ordering is coming soon") until the session-backed cart lands in Phase 7.

Unknown product, category or policy URLs show the 404 page with `noindex`, but with HTTP 200 (a "soft 404"). This is how Next's Partial Prefetching works: it sends the route's static shell for any URL that wasn't prerendered before the not-found result is known. Search engines respect the `noindex`. Unknown top-level paths (e.g. `/does-not-exist`) return a real 404.

E2E: `tests/e2e/catalogue.spec.ts` runs when the app is connected to the sandbox and skips otherwise. With the sandbox running and `.env.local` pointing at it, run `npm run test:e2e`.

## Cart & checkout (Phase 7)

| Route | What it does |
|---|---|
| Bag drawer | Opens after "Add to bag" and from the header icon. Without JavaScript the icon links to `/cart` |
| `/cart` | Line items, quantity steppers, remove, coupons, delivery options, WooCommerce totals |
| `/checkout` | Contact, address (district list, postcode), optional separate delivery address, notes, payment method, terms |
| `/checkout/order/[id]?key=…` | Confirmation read live from WooCommerce (REST v3), shown only with the order's secret key |

- **Client state**: `src/store/cart.ts` (Zustand) mirrors the latest cart response from `/api/cart*`. It never calculates prices, totals or stock. The cart itself is the WooCommerce session.
- **Checkout**: one Zod schema (`src/lib/checkout-schema.ts`) validates in the browser (React Hook Form) and again on the server. The request carries no prices. WooCommerce creates the order from the session cart and calculates everything.
- **Sri Lanka**: the 25 districts are sent as the address `state`. Phone numbers are normalised to +94. The 5-digit postcode is required because WooCommerce's address rules for Sri Lanka require it, and orders without one were rejected.
- **Payment methods**: a method is offered only if it's in `src/lib/payment-methods.ts`, has credentials on the storefront **and** is enabled in WooCommerce. See [docs/PAYMENT-CONFIGURATION.md](docs/PAYMENT-CONFIGURATION.md).
- **Order confirmation**: uses the storefront's own URL, never WooCommerce's `redirect_url`. The page re-reads the order server-side and compares the key in constant time. A wrong key, an unknown id and a missing key all show the same "can't show this order" page. `noindex`, `no-referrer`.
- **Abuse limits**: checkout and coupon endpoints are rate-limited per IP (10/min, in-memory and best-effort per instance; a shared store is planned for Phase 10).
- **Not yet built**: terms/policy pages (the checkout links `/policies/terms`, which arrive with the content pages), customer accounts (Phase 9), order emails (sent by WooCommerce itself).

E2E: `tests/e2e/checkout.spec.ts` covers add to bag, the drawer, persistence after reload, quantity, coupons (valid and invalid), totals, validation, a Cash on Delivery order and the confirmation page, plus API tampering checks. These tests place real orders in the sandbox, which lowers its stock until the next restart.

## Resilience

Catalogue reads from the Store API retry up to 3 times, with backoff, on 502/503/504, network errors or a non-JSON body (for example a PHP notice). That way a brief upstream blip doesn't fail a page render or a build. Writes (cart, checkout) are never retried automatically.

## Customer accounts (Phase 9)

| Route | |
|---|---|
| `/account` | Sign in and create account (signed out), or overview (recent orders, details) |
| `/account/orders`, `/account/orders/[id]` | Order history and details (scoped to the signed-in customer) |
| `/account/details` | Name, phone and default delivery address |
| `/account/forgot`, `/account/reset` | Password reset by email (WordPress sends the email; the link opens the storefront) |
| `/orders/track` | Guest tracking by order number and email |

- Passwords are checked and stored only by WordPress core, through signed server-to-server calls to the zoomx-headless plugin. The storefront keeps just a signed, HttpOnly session cookie with the customer id.
- Order pages share one component (`src/components/orders/order-details.tsx`) with the checkout confirmation, and show tracking numbers when a shipment-tracking plugin provides them.
- Orders placed while signed in are attached to the account. Guest orders are found with order number and email.
- Not built yet: pre-filling checkout from the saved address, and merging a guest's past orders into a new account.

E2E: `tests/e2e/account.spec.ts` covers register, sign-out, wrong password, sign-in, orders appearing in the account, saving details, isolation between customers, sign-in redirects, guest tracking (right and wrong email), password-reset messages and cross-site rejection. It runs on desktop only, because the flows don't depend on layout and this keeps registrations under the rate limit.

## Optimisation (Phase 10)

### Content pages
| Route | Content |
|---|---|
| `/about`, `/sustainability`, `/for-businesses` | The brand's own copy from zoomx.lk ([`src/content/pages.ts`](src/content/pages.ts)), with unproven claims left out (listed at the top of that file) |
| `/contact` | Real phone number, office and factory addresses, and a maps link. **No contact form** until an email delivery service is chosen. The email is shown once confirmed |
| `/faqs` | Draft: describes how this site works. `noindex` |
| `/policies/delivery`, `/returns`, `/privacy`, `/terms` | **Drafts awaiting client approval**: a visible "Draft" notice, `noindex`, kept out of the sitemap. [Bracketed] text marks facts only the business can provide; no fees, timeframes or windows are invented. The privacy draft lists the site's real cookies and data flows |

To approve a page: in WordPress, **ZOOM X → Pages**, replace the bracketed text and set Status to **Approved**. It then becomes indexable and is added to the sitemap. (Without WordPress, set `status: "approved-copy"` in `src/content/pages.ts`.)

### SEO
- `/sitemap.xml`: home, shop, content pages, approved policies, and every WooCommerce category and product (refreshed by the `products`/`categories` cache tags).
- `/robots.txt`: on an HTTPS production URL, allows everything except `/api`, `/cart`, `/checkout`, `/account` and `/orders/`. On any preview, `vercel.app` or local URL it **disallows everything**, so staging is never indexed.
- Organization JSON-LD on the home page (legal name, phone, address, logo). Product and Breadcrumb JSON-LD are on catalogue pages (Phase 5). Every page has a title, description and canonical. Private pages are `noindex`.
- Not yet: a default Open Graph image (no approved brand imagery yet).

### Security headers (next.config.ts)
- **CSP**: `default-src 'self'`. Scripts and styles from this site only (`'unsafe-inline'` for Next's inline bootstrap, because nonces would make every page dynamic). `form-action` limited to this site and PayHere. `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, plus `upgrade-insecure-requests` on HTTPS.
- **HSTS** (2 years, includeSubDomains) on HTTPS, plus COOP `same-origin`, `nosniff`, `X-Frame-Options: DENY`, a restrictive Permissions-Policy, and no `X-Powered-By`.
- Rate limiting is in-memory per server instance (best-effort). For strict global limits on Vercel, back `src/lib/rate-limit.ts` with a shared store such as Upstash Redis; that's a deployment decision.

### Accessibility
- `tests/e2e/a11y.spec.ts` runs axe-core (WCAG 2.0/2.1 A and AA) on 11 key pages, on desktop and mobile: **0 violations**.
- Already in place: skip link, landmarks, one h1 per page, labelled forms with linked errors, focus-trapped dialogs, visible focus rings, reduced-motion support (MotionProvider), and an accessible bag count.
- Automated scans catch only part of the issues. A manual pass with NVDA/VoiceOver and keyboard only is recommended before launch.

### Performance (local production build, headless Chromium)
| Page | LCP | JS transferred |
|---|---|---|
| `/` | ~1.0 s | ~239 KB |
| `/shop` | ~0.2 s | ~244 KB |
| `/product/…` | ~0.6 s | ~244 KB |

`tests/e2e/perf.spec.ts` enforces a budget (LCP < 2.5 s, JS < 350 KB) to catch regressions. Measure real-world Core Web Vitals on Vercel (Speed Insights) once deployed: the sandbox has no product images yet, and real packshots will affect LCP.

### Test infrastructure
- `tests/e2e/global-setup.ts` restocks the sandbox products that order tests use, then refreshes the catalogue cache through `/api/revalidate`. It only acts when `WOOCOMMERCE_STORE_URL` is the local sandbox.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and push to `main`: lint → typecheck → unit tests → production build → Playwright e2e. CI has no WooCommerce, so store-dependent specs skip themselves and the no-store behaviour is checked instead. Locally this setup gives 49 passed and 73 skipped. The full suite (97 tests) runs locally against the sandbox. Node 24 is pinned via `.nvmrc` and `engines`.

# ZOOM X — Phase 1 Technical Audit

_Audit date: 2026-11-10 · Method: public crawl of https://zoomx.lk (HTML, `/wp-json/`, sitemap). No admin access was available._

---

## 1. Headline finding — there is no WooCommerce store yet

The spec assumes an existing WordPress + WooCommerce backend. **It does not exist on zoomx.lk.**

| Check | Result |
|---|---|
| `GET /wp-json/` namespaces | `wp/v2`, `elementor*`, `jet-elements-api`, `wp-rocket`, `code-snippets`, `wp-toolkit` — **no `wc/v3`, no `wc/store/v1`** |
| `GET /wp-json/wc/store/v1/products` | `404 rest_no_route` |
| `GET /wp-json/wc/store/v1/cart` | `404 rest_no_route` |
| Sitemap | Posts, pages, categories, users only — no `product` post type |
| Theme / builder | Hello Elementor + Elementor Pro + JetElements |

The current site is an **Elementor brochure site** with an "Enquire" CTA. There are no products, prices, stock, customers, orders, coupons, shipping zones, taxes or payment gateways in WordPress. (WooCommerce could be installed but deactivated — only admin access can confirm.)

**Consequence:** Phases 6–9 (WooCommerce integration, cart, checkout, payments, accounts) cannot be built against real data until WooCommerce is installed and the catalogue is entered by the business. Nothing in the spec allows us to invent prices, sizes or stock, so we will not.

---

## 2. Existing site content inventory

### Pages (`wp/v2/pages`)
Home · About Us · Products · For Businesses · Sustainability · Contact Us · plus junk pages to remove: `wrd` ("test"), `sample-page`.

### Navigation (current)
Home · About Us · Products · For Businesses · Sustainability · Contact Us · **Enquire** (CTA)

### Product range (names only — from Products page)
| Product | Size(s) published | Price |
|---|---|---|
| Laundry Detergent | 550 ml | **none published** |
| Fabric Conditioner | not stated | none |
| Dish Washing Liquid | not stated | none |
| All Purpose & All Surface Cleaner | not stated | none |
| Toilet Bowl Cleaner | not stated | none |
| Air Freshener | not stated | none |
| Hand Wash | not stated | none |
| Glass Cleaner | not stated | none |
| Tile Cleaner | not stated | none |
| General Purpose Cleaner | not stated | none |
| "Brightclean" (home page) | unclear if separate SKU | none |

Bulk/B2B: "5L, 10L, 20L, etc." containers, "custom pricing" (For Businesses page).

**Proposed WooCommerce categories (needs approval):** Laundry Care · Kitchen & Dish · Surface Cleaners · Bathroom & Toilet · Air Care · Personal Hygiene. The live site has no category taxonomy for products.

### Brand messaging (authentic, reusable)
- Taglines: "Pure Power, Gentle Touch." · "Where Clean Meets Care" · "We believe in clean that cares." · "Pure Products. Powerful Results."
- Values: Quality, Innovation, Integrity, Sustainability.
- Pillars: Simple / Safe / Sustainable / Super Effective.
- Our Story + Sustainability copy exists and is usable for About and Brand Story sections.

### Business details
- Legal entity: **Capital Wills Holdings (Pvt) Ltd** — footer: "© 2025 ZoomX by Wills"
- Office: No 419, Galle Road, Ratmalana, Sri Lanka
- Factory: No 49, 10th Cross Lane, Borupona, Sri Lanka
- Phone: +94 777 878 667
- Email: obfuscated by Cloudflare on the page — **needs confirmation**
- Social: Facebook / Twitter / YouTube icons are present but **no real URLs** were found — **needs the actual handles**

### Brand colour
Most-used greens in the markup: `#00B42C` (primary candidate), `#49A010`, `#8DC637`. Accent yellow `#FDBF00`. **Must be confirmed against the master logo file** — the web logo is a 300×65 webp, not a vector.

---

## 3. Asset & claim risks (must resolve before reuse)

| Issue | Evidence | Action needed |
|---|---|---|
| **Product imagery is AI-generated renders, not packshots** | Filenames like `ChatGPT_Image_May_27…`, `3D-Purple-Cleaner-Bottle_remix…`, `Floating-Dish-Soap_remix…` | Real studio packshots of actual packaging on white/neutral background (Apple-style presentation depends on this) |
| **Stock photo with watermark-preview ID** | `happy-business-woman-portrait-selfie-260nw-…` (Shutterstock preview size) | Remove or license |
| Logo only as small raster | `Weblook-300x65…webp`, `cropped-ChatGPT_Image…-removebg` | SVG / high-res logo |
| Unverified product claims | "Dermatologically tested and certified", "Lab tested and certified for food contact surfaces", "99.9% Germ Kill Efficiency", "free from phosphates and parabens", "biodegradable" | Certificates / lab reports, or approval to remove. We will not publish these without confirmation |
| Testimonials | None verified found | Section 10 hidden until real reviews exist (WooCommerce verified-buyer reviews later) |
| Policies | "Terms and Policies" link only; no delivery / returns / privacy content | Draft templates marked **CLIENT APPROVAL REQUIRED** |

---

## 4. Apple design reference — what we take (and don't)

Taken as principles (no assets, copy or marks reused):
- Thin translucent global nav (~44–48px, backdrop blur), centred links, utility icons right; full-screen flyout on mobile.
- Hero = one product, one headline, one sentence, two text/pill CTAs; product image dominates.
- Alternating `#FFFFFF` / `#F5F5F7` full-bleed sections instead of cards and borders.
- Large tight-tracked headings (clamp ~40→80px), 17px body, generous vertical rhythm (~80–120px section padding).
- Horizontally scrolling product/category rails with snap.
- Restrained motion: fade/translate on scroll, respects `prefers-reduced-motion`.
- Commerce flow: bag icon with count, minimal bag page, clear "Check Out" pill.

Zoom X identity layered on: brand green used only for primary CTAs, price-sale accents, and small "eco" signifiers; product colour (lemon, lavender, rose fragrances) carries the visual warmth.

_Note: apple.com was not crawled in this pass; the patterns above are long-standing and well documented. A visual pass with screenshots happens in Phase 3._

---

## 5. Missing access, credentials & decisions

### Blocking (needed before Phase 6)
1. **WordPress admin access** (Administrator role) to zoomx.lk — or confirmation that the store should live on a subdomain (e.g. `shop-api.zoomx.lk` / `cms.zoomx.lk`).
2. **Decision: install WooCommerce on the existing site?** Also requires: hosting PHP ≥ 8.1, SSL, and a staging copy so the live brochure site is not disturbed.
3. **Product master data** for every SKU: name, sizes/variants, SKU codes, retail price (LKR), sale price, stock, weight/dimensions (for shipping), short + long description, usage, ingredients only as officially approved.
4. **Shipping rules**: zones (island-wide / Colombo / districts), rates, free-shipping thresholds, timeframes.
5. **Tax**: is VAT charged / are prices VAT-inclusive? (Not to be guessed.)
6. **Payment gateway accounts**: PayHere merchant ID + secret (sandbox and live); WEBXPAY — is it actually required? COD rules (limits / districts).

### Needed for design (Phase 3–4)
7. Vector logo + brand guidelines (exact green).
8. Real packshots of every product + lifestyle imagery licences.
9. Official email address, real social media URLs.
10. Verification documents for product claims (Section 3).
11. Policy content or approval to draft templates.

### Needed for deployment (Phase 11)
12. GitHub org/repo, Vercel team access, DNS access for `zoomx.lk` (Cloudflare appears to be in front).

---

## 6. Proposed architecture

```
Browser ──► Next.js (Vercel)
              ├─ RSC pages: home, shop, category, product  ──► Store API (public, cached, tag-revalidated)
              ├─ Route handlers /api/cart/*, /api/checkout  ──► Store API (Cart-Token header, server-side only)
              ├─ /api/auth/*  ──► WP auth (JWT/app-password plugin or WooCommerce session bridge — decided in Phase 9)
              ├─ /api/account/orders ──► WC REST v3 (consumer key/secret, server-only, filtered by customer id)
              ├─ /api/webhooks/woocommerce ──► HMAC-SHA256 verify ──► revalidateTag(product:*)
              └─ /api/payments/payhere/notify ──► md5sig verify ──► WC REST: set order status (idempotent)
          WordPress + WooCommerce (existing host) = single source of truth
```

Key decisions:
- **Cart session**: Store API's `Cart-Token` (JWT returned in the response header) kept in an **HttpOnly, Secure, SameSite=Lax** cookie set by Next.js. The browser never calls WooCommerce directly → no CORS, no third-party cookie problems, no exposed nonce. Zustand holds only UI state (drawer open, optimistic count).
- **Catalogue reads** use the public Store API from Server Components with `fetch` cache tags (`products`, `product:<id>`, `categories`); WooCommerce webhooks trigger `revalidateTag`. Stock and price are re-read live on add-to-cart and checkout; totals always come from WooCommerce.
- **Payments**: prefer the official PayHere WooCommerce plugin on the WP side. The headless checkout creates the order via Store API with `payment_method=payhere`; Next.js builds the signed PayHere form server-side; PayHere's `notify_url` points at the WP plugin (or our verified handler). Order status changes only on a verified server notification — never on the return page.
- **Secrets** only in server env vars; `env.ts` validates with Zod at boot; no `NEXT_PUBLIC_` secrets.
- **No second database.** Rate limiting via Vercel KV/Upstash is the only possible extra service (optional, decided in Phase 10).

Stack (as specified): Next.js App Router + TypeScript + Tailwind + Framer Motion + Lucide + React Hook Form + Zod + Zustand; Vitest + RTL + Playwright.

---

## 7. Roadmap

| Phase | Can start now? | Notes |
|---|---|---|
| 2 Foundation | ✅ | Next.js scaffold, env validation, lint/test tooling, Git |
| 3 Design system | ✅ | Tokens, type scale, buttons, nav, footer — green value provisional |
| 4 Homepage | ⚠️ partial | Layout + real brand copy; product sections need data; imagery placeholders flagged |
| 5 Catalogue UI | ⚠️ partial | Built against typed Store API contracts + a **staging** WooCommerce with client-approved test data |
| 6 Woo integration | ❌ | Needs WooCommerce installed (staging at minimum) |
| 7 Cart & checkout | ❌ | Needs shipping/tax config |
| 8 Payments | ❌ | Needs PayHere sandbox credentials |
| 9 Accounts | ❌ | Needs auth plugin decision on WP |
| 10 Optimisation & tests | — | Continuous |
| 11 Deployment | ❌ | Needs Vercel/DNS access |

**Recommended unblock path:** client installs WooCommerce on a **staging** copy of zoomx.lk (or we do it with admin access), enters 2–3 real products with real prices, and provides PayHere sandbox credentials. Phases 2–5 proceed in parallel.

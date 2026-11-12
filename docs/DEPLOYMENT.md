# Deployment guide

Target setup: **storefront on Vercel at `zoomx.lk`**, and **WordPress + WooCommerce on the existing host at a subdomain** (for example `cms.zoomx.lk`). Do everything on **staging first**: a Vercel Preview deployment connected to a staging copy of WordPress, with PayHere in sandbox mode.

Related guides: [WooCommerce integration](WOOCOMMERCE-INTEGRATION.md) · [Payments](PAYMENT-CONFIGURATION.md) · [Client handover](CLIENT-HANDOVER.md)

> **Preview mode (no store connected yet).** If `WOOCOMMERCE_STORE_URL` is not set — e.g. the first Vercel deployment, before WordPress is hosted — the storefront shows the real ZOOM X range from `sandbox/catalogue/` (names, sizes, copy, packshots in `public/catalogue/`) with **"Price coming soon"**, buying turned off, and a banner pointing customers to the phone number. No prices are invented. Setting `WOOCOMMERCE_STORE_URL` (and the keys below) and redeploying switches to the live store automatically. The local sandbox (`127.0.0.1:9400`) only exists on the developer's machine and can never be used from Vercel.

---

## 0. What you need

| Item | Who provides it |
|---|---|
| WordPress administrator access (live and a staging copy) | ZOOM X / current web host |
| Hosting with PHP ≥ 8.1, HTTPS, and outbound HTTPS allowed | Web host |
| Product master data (names, sizes, SKUs, prices, stock, weights, images) | ZOOM X |
| Shipping zones and rates, VAT treatment, COD rules | ZOOM X |
| GitHub repository and Vercel team | ZOOM X (or the agency, then transferred) |
| DNS access for `zoomx.lk` (Cloudflare appears to be in front) | ZOOM X |
| PayHere merchant accounts: sandbox, then live | ZOOM X |
| Approved policy texts (delivery, returns, privacy, terms) | ZOOM X / legal |

## 1. Prepare WordPress + WooCommerce (staging first)

1. **Move WordPress to its subdomain**, e.g. `cms.zoomx.lk`, with a valid SSL certificate. Update *Settings → General* (WordPress Address and Site Address) and search-replace the old URL in the database (WP-CLI `wp search-replace`, or the host's tool). The public brochure site is replaced by the storefront, so WordPress only needs to serve the admin, the REST API and media.
2. **Install WooCommerce** and run the setup wizard: store country **Sri Lanka**, currency **LKR**.
3. *WooCommerce → Settings*:
   - **General**: selling and shipping locations Sri Lanka. Currency LKR, 2 decimals.
   - **Tax**: set according to ZOOM X's VAT position (don't guess).
   - **Shipping**: zones, methods and rates as provided by ZOOM X. The storefront shows whatever WooCommerce returns.
   - **Payments**: enable **Cash on delivery**, and **PayHere (headless storefront)** once step 4 is done.
   - **Accounts & Privacy**: allow guest checkout. Allow customers to create an account on the "My account" page.
   - **Products → Inventory**: manage stock on. **Hold stock (minutes)** = 60, which releases unpaid PayHere orders.
   - **Advanced → REST API**: add a key for a dedicated user (e.g. `storefront-api`, role *Shop manager*), permission **Read/Write**. Copy the consumer key and secret; they are shown once.
   - **Advanced → Webhooks**: the six webhooks listed in [WOOCOMMERCE-INTEGRATION.md §3](WOOCOMMERCE-INTEGRATION.md), delivery URL `https://<storefront>/api/webhooks/woocommerce`, with one shared secret.
4. **Install the storefront plugin**: zip `wordpress-plugin/zoomx-headless-payments/` and upload it under *Plugins → Add New → Upload*, then activate. Add to `wp-config.php`:
   ```php
   define('ZOOMX_HEADLESS_SECRET', '<same value as WORDPRESS_AUTH_SECRET in Vercel>');
   define('ZOOMX_STOREFRONT_URL', 'https://zoomx.lk'); // staging: the preview URL
   ```
5. **Permalinks**: anything except "Plain", so `/wp-json/` works.
6. **Security plugins / Cloudflare / WAF**: allow `/wp-json/wc/store/*`, `/wp-json/wc/v3/*` and `/wp-json/zoomx/v1/*` from Vercel. Don't strip the `Cart-Token` request or response headers. Don't serve a challenge page to API requests.
7. **Email**: make sure WordPress sends mail reliably (an SMTP plugin with a transactional provider). WooCommerce order emails and password-reset emails depend on it.
8. **Enter the catalogue**: see [CLIENT-HANDOVER.md](CLIENT-HANDOVER.md) for product data conventions.

Quick check from any machine:
```bash
curl -s https://cms.zoomx.lk/wp-json/wc/store/v1/products | head -c 300
```

## 2. Vercel project

1. **Import** the GitHub repository in Vercel. The framework preset is Next.js and the defaults are fine: the build command is `npm run build` (it passes `--webpack`), the Node version comes from `package.json` → `engines` (24).
2. **Environment variables**: set **Preview** (staging) and **Production** separately.

| Variable | Preview | Production |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<preview domain>` | `https://zoomx.lk` |
| `WOOCOMMERCE_STORE_URL` | `https://staging-cms…` | `https://cms.zoomx.lk` |
| `WOOCOMMERCE_CONSUMER_KEY` / `_SECRET` | staging key | live key |
| `WOOCOMMERCE_WEBHOOK_SECRET` | staging webhook secret | live webhook secret |
| `WORDPRESS_AUTH_SECRET` | = staging `ZOOMX_HEADLESS_SECRET` | = live `ZOOMX_HEADLESS_SECRET` |
| `SESSION_SECRET` | random ≥ 32 characters | **different** random ≥ 32 characters |
| `REVALIDATE_SECRET` | random | random |
| `PAYHERE_MODE` | `sandbox` | `live` |
| `PAYHERE_MERCHANT_ID` / `_SECRET` | sandbox values (secret for the preview domain) | live values (secret for `zoomx.lk`) |

   Generate secrets with `node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"`. Never use a `NEXT_PUBLIC_` prefix for a secret. A misconfigured value fails safely: the feature switches off (for example PayHere isn't offered) instead of faking behaviour.

3. **Use a stable preview domain** (e.g. `staging.zoomx.lk` assigned to a `staging` branch). PayHere ties merchant secrets to a domain, so random preview URLs can't take payments.
4. **Protect previews**: enable Vercel Deployment Protection for previews. `robots.txt` already blocks indexing on non-production URLs.
5. Changing environment variables needs a **redeploy** (several pages are prerendered).

## 3. Staging acceptance (before DNS)

Work through this on the staging URL:

- [ ] Home, shop, categories and product pages show the real catalogue; sale prices and out-of-stock items are correct.
- [ ] Edit a price in WooCommerce → it shows on the product page within seconds (webhook). Check *Webhooks → Logs* for 200 responses.
- [ ] Add to bag, change quantity, coupon, delivery options and totals match WooCommerce.
- [ ] Cash on Delivery order → confirmation page, order in WooCommerce *Processing*, emails received.
- [ ] PayHere sandbox: pay with a sandbox test card → order *Processing*, transaction id set, note "verified". Cancel at PayHere → "Payment cancelled", order still *Pending payment*. (See [PAYMENT-CONFIGURATION.md](PAYMENT-CONFIGURATION.md).)
- [ ] Register, sign out and in, password-reset email arrives and the link opens the storefront, order history, saving details.
- [ ] Guest tracking with order number + email.
- [ ] `/sitemap.xml` lists real products; `/robots.txt` disallows everything on staging.
- [ ] Mobile check on a real phone (iOS Safari, Android Chrome).
- [ ] CI is green on the release commit.

## 4. Go live: DNS and SSL

1. Lower the TTL on the `zoomx.lk` records a day ahead.
2. In Vercel → Project → Domains, add `zoomx.lk` and `www.zoomx.lk` (redirect `www` → apex). Vercel shows the exact DNS records to create; use those values.
3. In Cloudflare DNS, create the records as **DNS only** (grey cloud), so Vercel can issue and renew SSL. Keep `cms.zoomx.lk` pointing at the WordPress host.
4. Wait for Vercel to show the domain as valid with a certificate.
5. Update production values that contain the domain: `NEXT_PUBLIC_SITE_URL`, the WordPress `ZOOMX_STOREFRONT_URL`, webhook delivery URLs, and the PayHere domain approval. Redeploy.
6. **301 redirects from old brochure URLs** (keeps search rankings): add to `next.config.ts` → `redirects()`, for example `/about-us` → `/about`, `/contact-us` → `/contact`, `/products` → `/shop`. Confirm the full list from the old sitemap before launch.
7. Smoke test production: one Cash on Delivery order, and one small live PayHere payment that you then refund in the PayHere portal.
8. Submit `https://zoomx.lk/sitemap.xml` in Google Search Console.

## 5. Rollback

- **Storefront**: Vercel → Deployments → previous deployment → *Promote to Production* (instant).
- **DNS**: point `zoomx.lk` back to the old host (only while the brochure site still exists there).
- WooCommerce data is unaffected by storefront rollbacks.

## 6. Operations

| What | Where |
|---|---|
| Runtime errors, API failures | Vercel → Logs (look for `[api]`, `[payhere]`, `[webhook]`, `[auth]` prefixes, which never contain secrets or card data) |
| Real-user performance | Vercel Speed Insights |
| Webhook delivery | WooCommerce → Settings → Advanced → Webhooks → Logs |
| Orders, payments, refunds | WooCommerce admin, PayHere merchant portal |
| Cache stuck? | `POST /api/revalidate` with `{"tags":["products","categories"]}` (see the integration guide) |

**Known production follow-ups**
- Rate limiting is in memory per Vercel instance. For strict limits, add a shared store (e.g. Upstash Redis) to `src/lib/rate-limit.ts`.
- Unknown product, category or policy URLs return 200 with `noindex` (Next Partial Prefetching behaviour; see the README).
- Contact form: add one once an email provider is chosen.

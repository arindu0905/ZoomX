# WooCommerce integration guide

How the storefront talks to WooCommerce, and what has to be set up on the WordPress side. WooCommerce stays the single source of truth for products, prices, stock, carts, customers and orders. Next.js stores none of it.

## 1. Data flow

```
Browser ──► Next.js (Vercel) ──► WooCommerce Store API   (public catalogue, customer cart)
                     │        └─► WooCommerce REST API v3 (server-only, consumer key/secret — Phase 9)
                     ◄────────── WooCommerce webhooks     (HMAC-signed → cache refresh)
```

The browser never calls WooCommerce directly. That means no CORS setup, no third-party cookies, and no secrets or nonces in client code.

| Concern | Where | Notes |
|---|---|---|
| Catalogue reads | `src/services/woocommerce/catalog.ts` | Server Components, `"use cache"` + tags `products`, `categories`, `product:<id>` |
| Cart session | `src/services/woocommerce/session.ts` | `Cart-Token` in signed HttpOnly cookie `zx_cart` |
| Cart operations | `src/services/woocommerce/cart.ts` | Never cached; WooCommerce calculates every total |
| Cart HTTP API | `src/app/api/cart/**` | Same-origin + JSON checks, Zod input validation, `private, no-store` |
| Cache refresh | `src/app/api/webhooks/woocommerce`, `src/app/api/revalidate` | Signature / bearer-token protected |

## 2. Cart sessions

- WooCommerce's Store API identifies a cart by the **`Cart-Token`** response header (a JWT signed by WooCommerce, valid about 48 h by default).
- Next.js stores it in the cookie **`zx_cart`**: `HttpOnly`, `SameSite=Lax`, `Secure` in production, and HMAC-SHA256-signed with `SESSION_SECRET`. A tampered or forged cookie is ignored, and the customer gets a fresh empty cart.
- **Nonces**: WooCommerce skips its nonce check for requests that carry a valid `Cart-Token`. For a customer's very first change (no token yet), the client first sends `GET /cart` to get a token, then makes the change. No nonce is ever stored or exposed.
- When WooCommerce issues a new token (new or expired session), the cookie is updated automatically.

### Storefront cart endpoints

| Method | Path | Body |
|---|---|---|
| GET | `/api/cart` | — |
| POST | `/api/cart/items` | `{ id, quantity, variation? }` |
| PATCH | `/api/cart/items/:key` | `{ quantity }` |
| DELETE | `/api/cart/items/:key` | — |
| POST | `/api/cart/coupons` | `{ code }` (rate-limited) |
| DELETE | `/api/cart/coupons/:code` | — |
| POST | `/api/cart/shipping` | `{ packageId, rateId }` |
| POST | `/api/checkout` | contact, addresses, note, `paymentMethod`, `terms` (rate-limited) |

Only ids, quantities and attribute values are forwarded. Prices, stock and totals are never accepted from the browser. WooCommerce's own error messages (for example "out of stock") are passed to the customer. Any other failure returns a generic message, and the details are logged on the server only.

### Checkout and orders

- `POST /api/checkout` re-validates the form and checks that the cart isn't empty, has no WooCommerce errors and offers the chosen payment method. It then calls Store API `POST /checkout` with the session's Cart-Token. WooCommerce calculates prices, discounts, shipping, tax and stock, and creates the order.
- The confirmation page reads the order with **REST v3** (`GET /wc/v3/orders/:id`) on the server and shows it only if the URL's `key` matches `order_key` (constant-time compare). The Store API's own order endpoint only covers orders still awaiting payment, so it can't be used here.
- WooCommerce's address rules for Sri Lanka require a postcode; the form enforces it.

## 3. Cache refresh (webhooks)

Create these in **WooCommerce → Settings → Advanced → Webhooks**. Each one has Status: Active, API version: WP REST API v3, and the same **Secret** as `WOOCOMMERCE_WEBHOOK_SECRET`.

| Name | Topic | Delivery URL |
|---|---|---|
| Product created | Product created | `https://<site>/api/webhooks/woocommerce` |
| Product updated | Product updated | 〃 |
| Product deleted | Product deleted | 〃 |
| Product restored | Product restored | 〃 |
| Order created | Order created | 〃 (refreshes stock shown on product pages) |
| Order updated | Order updated | 〃 |

Optional: an action webhook on `edited_product_cat` refreshes category names and descriptions.

Behaviour:
- The signature (`X-WC-Webhook-Signature` = base64 HMAC-SHA256 of the raw body) is checked in constant time. Unsigned or wrongly signed requests get **401**.
- The unsigned ping WooCommerce sends when a webhook is saved (`webhook_id=<n>`) gets a 200 and changes nothing.
- Matching tags are refreshed with `expire: 0`, so the next visitor sees the new price or stock rather than a stale copy. Refreshing is idempotent, so duplicate deliveries do no harm.
- Payloads over 1 MB are rejected.

Stock shown on product pages is a convenience. **WooCommerce re-checks stock when an item is added to the cart and again at checkout**, and that is what prevents overselling.

### Manual refresh

```bash
curl -X POST https://<site>/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET" -H "Content-Type: application/json" \
  -d '{"tags":["products","categories"]}'
```

Allowed tags: `products`, `categories`, `product:<id>`.

## 4. Required WordPress setup

1. WooCommerce installed and active, store currency **LKR**, country **Sri Lanka**.
2. Permalinks set to anything other than "Plain", so `/wp-json/` works.
3. Shipping zones and methods configured (the storefront shows whatever WooCommerce returns).
4. Webhooks as in §3.
5. Phase 9: REST API key (WooCommerce → Settings → Advanced → REST API), Read/Write, for a dedicated API user.
6. If a security plugin or Cloudflare rule blocks `/wp-json/wc/store/*` or strips the `Cart-Token` header, allow it for the Vercel egress.

## 5. Environment

| Variable | Used for |
|---|---|
| `WOOCOMMERCE_STORE_URL` | Base URL of the WordPress site |
| `WOOCOMMERCE_REQUEST_TIMEOUT_MS` | Per-request timeout (default 10 s) |
| `SESSION_SECRET` | Signs the cart cookie (≥ 32 random characters) |
| `WOOCOMMERCE_WEBHOOK_SECRET` | Verifies webhook signatures |
| `REVALIDATE_SECRET` | Manual refresh endpoint |
| `WOOCOMMERCE_CONSUMER_KEY` / `_SECRET` | REST v3 (Phase 9) |

Generate secrets with `node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"`. Use different values in each environment.

## 6. Verified against the sandbox

- The cart survives across requests via the cookie. Totals match WooCommerce (2 × 1,100 + 650 + 350 shipping = LKR 3,200). Out-of-stock sizes are refused with WooCommerce's message.
- Cross-site writes return 403, a forged cookie gets an empty cart, and malformed input returns 400.
- A real price change in WooCommerce stays cached until the signed webhook arrives, then shows on the very next page load.
- Automated: `tests/e2e/cart-api.spec.ts`, `tests/unit/security.test.ts`, `tests/unit/revalidation.test.ts`.

## 7. Customer accounts (Phase 9)

WordPress core can't check a customer's password over its REST API, and the storefront must never store passwords. So the **zoomx-headless plugin** (`wordpress-plugin/zoomx-headless-payments`, v1.1) exposes signed server-to-server endpoints that call WordPress core:

| Endpoint (`/wp-json/zoomx/v1/…`) | Uses | Notes |
|---|---|---|
| `auth/login` | `wp_authenticate` | Generic "Incorrect email or password." **Staff accounts (edit_posts / manage_woocommerce) are refused**: they use wp-admin |
| `auth/register` | `wc_create_new_customer` | Only if WooCommerce → Accounts → "Allow customers to create an account on My account" is on. Generic failure message, so it doesn't reveal existing emails |
| `auth/lost-password` | `retrieve_password` | Always `{ ok: true }`. The reset email's link is rewritten to `<storefront>/account/reset?key=…&login=…` |
| `auth/reset-password` | `check_password_reset_key` + `reset_password` | |

**Request signing**: `X-ZoomX-Timestamp` (Unix seconds, ±5 min) and `X-ZoomX-Signature` = hex(HMAC-SHA256(`timestamp + "." + raw body`, secret)). Unsigned, stale or wrong signatures get 401. The secret is `ZOOMX_HEADLESS_SECRET` in `wp-config.php` (or the `zoomx_headless_secret` option) and must equal `WORDPRESS_AUTH_SECRET` in Vercel.

WordPress setup: activate the plugin and `define('ZOOMX_HEADLESS_SECRET', '<64 hex chars>');` plus `define('ZOOMX_STOREFRONT_URL', 'https://zoomx.lk');` in `wp-config.php`. Turn on account creation on the "My account" page in WooCommerce → Settings → Accounts & Privacy.

**Storefront session**: `zx_session` is an HttpOnly, SameSite=Lax cookie (Secure in production), valid for 14 days. It holds only the customer id and expiry, HMAC-signed with a key derived from `SESSION_SECRET`, so it's separate from the cart cookie. No WordPress cookie or token is stored.

**Data access**: profile, addresses and orders are read and written with REST v3, always using the customer id from the signed session and never an id from the browser. `/account/orders/:id` returns "Order not found" unless `order.customer_id` equals the session's customer.

**Orders while signed in**: the Store API cart is a guest session, so after checkout the order is attached to the signed-in customer (`customer_id` via REST v3).

**Guest tracking** (`/orders/track`): order number plus the billing email on the order (case-insensitive, constant-time compare). On a match it redirects to the order's key-protected page. A wrong combination gets one generic message.

**Tracking numbers**: WooCommerce core has no tracking field. If the *WooCommerce Shipment Tracking* plugin is used, its `_wc_shipment_tracking_items` are shown on order pages (only https links are rendered).

**Rate limits (per IP, in-memory)**: login 20/15 min plus 8/15 min per account, register 10/hour, forgot 5/hour, reset 10/hour, tracking 10/15 min, checkout 20/min, coupons 10/min.

# Payment configuration guide

| Method | Status | Where payment is confirmed |
|---|---|---|
| Cash on Delivery | ✅ Live-ready | Order goes straight to **Processing**. Cash is collected on delivery |
| PayHere (cards, wallets) | ✅ Built and verified with test values. **Needs real sandbox credentials** for an end-to-end test | PayHere's signed server notification → `/api/payments/payhere/notify` |
| WEBXPAY | ⏸ Not built | Waiting for the business to confirm it's needed (see §5) |

No payment is ever treated as successful because a customer reached a page. Only a **signed PayHere notification** whose amount and currency match the WooCommerce order can mark it paid.

## 1. How a PayHere payment works

```
Checkout (storefront)
  └─ POST /api/checkout  (payment method: zoomx_payhere)
       └─ WooCommerce Store API creates the order → status "Pending payment"
  └─ /checkout/pay/:id?key=…     (storefront page)
       └─ reads the order from WooCommerce (REST v3), builds the form, signs it server-side
       └─ auto-posts to PayHere (sandbox.payhere.lk or www.payhere.lk)
Customer pays on PayHere
  ├─ PayHere → POST /api/payments/payhere/notify      (server to server)
  │    1. merchant_id must match
  │    2. md5sig verified (constant time)
  │    3. order exists and uses zoomx_payhere
  │    4. paid amount + currency == WooCommerce order total, else "On hold" for review
  │    5. update the order via REST v3 (set_paid, transaction_id, private note)
  └─ customer returns to /checkout/order/:id?key=…
       └─ shows the order's real status. "Confirming your payment…" refreshes until the notification lands
```

Formulas (from PayHere's Checkout API docs, updated 4 Sep 2026), implemented in `src/services/payments/payhere-core.ts`:

```
hash   = UPPER(md5(merchant_id + order_id + amount + currency + UPPER(md5(merchant_secret))))
md5sig = UPPER(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(md5(merchant_secret))))
amount = two decimals, "." separator, no thousands separator (e.g. 1450.00)
```

### What each notification does

| `status_code` | Meaning | Effect on the WooCommerce order |
|---|---|---|
| `2` | Success | **Processing**, paid, `transaction_id` = PayHere payment id. A duplicate does nothing. A *different* payment id on an already-paid order adds a "check for double charge" note |
| `0` | Pending | Private note only |
| `-1` | Cancelled by the customer | Note only. The order stays pending so they can **Pay now** again, and WooCommerce's "Hold stock" timer cancels it if it's abandoned |
| `-2` | Failed | **Failed**, unless the order was already paid (then a note only, never a downgrade) |
| `-3` | Charged back | **On hold** plus a note for staff |
| success, wrong amount or currency | — | **On hold**, *not* paid, with a note giving both amounts |

Bad signature → 401. Wrong merchant → 400. Unknown order → 404. Order not using PayHere → 409. None of these touch any order. Processing is idempotent, so any retries PayHere sends are safe.

## 2. WordPress setup

1. Install and activate **`wordpress-plugin/zoomx-headless-payments`** (zip the folder and upload it under Plugins → Add New → Upload). It registers the payment method `zoomx_payhere`. It **holds no credentials and never marks anything paid**: it only lets WooCommerce accept the method and leaves the order pending.
2. WooCommerce → Settings → Payments → **PayHere (headless storefront)** → Enable. The title shown there is the internal name; the storefront shows its own label.
3. WooCommerce → Settings → Products → Inventory → **Hold stock (minutes)**: keep it set (default 60), so abandoned unpaid orders release their stock.
4. Do **not** also enable PayHere's official plugin for the same checkout. That plugin runs payment on WordPress pages, which a headless storefront doesn't use. (They can be installed side by side because the ids differ.)

### Why not PayHere's official plugin?
That plugin (`payhere-payment-gateway`) sends the customer through WordPress's own order-pay and order-received pages, which a headless storefront doesn't have. Its documentation (last updated Oct 2022) also says nothing about WooCommerce's block/Store API checkout. Running the gateway step in Next.js keeps the customer on the storefront and lets the notification handler be unit-tested and checked against the WooCommerce order total.

## 3. PayHere account setup

1. Create a **sandbox** merchant account at https://sandbox.payhere.lk.
2. Side menu → **Integrations** → add the storefront domain (e.g. `zoomx.lk`; for staging, the Vercel preview domain), then **Request to Allow**. Approval can take up to 24 hours. Each domain gets **its own Merchant Secret**; keep only one integration record per domain.
3. Copy the **Merchant ID** (account-wide) and the domain's **Merchant Secret**.
4. Payments must start from the registered domain, and the browser's Referer is checked. The `/checkout/pay` page deliberately keeps `strict-origin-when-cross-origin`; don't change it to `no-referrer`.
5. The notify URL must be publicly reachable over HTTPS. PayHere can't call `localhost`, so test notifications against a Vercel preview deployment.

## 4. Storefront environment (Vercel)

| Variable | Preview (staging) | Production |
|---|---|---|
| `PAYHERE_MODE` | `sandbox` | `live` |
| `PAYHERE_MERCHANT_ID` | sandbox merchant id | live merchant id |
| `PAYHERE_MERCHANT_SECRET` | sandbox secret **for the preview domain** | live secret **for zoomx.lk** |
| `NEXT_PUBLIC_SITE_URL` | `https://<preview domain>` | `https://zoomx.lk` |

- PayHere is offered only when both credentials are set **and** the method is enabled in WooCommerce. Otherwise checkout shows Cash on Delivery only, and the notify endpoint answers 503.
- The checkout page is prerendered, so changing these variables requires a **redeploy**.
- `NEXT_PUBLIC_SITE_URL` is used to build `return_url`, `cancel_url` and `notify_url`.
- The secret only ever contributes to the hash on the server. It never reaches the browser, the page HTML or the logs.

## 5. Not yet done (needs business input)

- **End-to-end sandbox payment**: the signing, the notification handling and the WooCommerce updates have been verified against the local WooCommerce sandbox, using **test values only** (signed notifications sent by script on a separate test server). A real PayHere sandbox payment needs your sandbox Merchant ID and Secret, plus a public preview URL.
- **Refunds**: done by staff in the PayHere merchant portal, then recorded in WooCommerce (Order → Refund → "Refund manually"). Automatic refunds via PayHere's Refund API need PayHere *Business App* OAuth credentials and are not built.
- **WEBXPAY**: please confirm whether the business needs it. If it does, it will follow the same pattern (server-side signing, verified callback, amount check, idempotent order update), once WEBXPAY's merchant documentation and sandbox credentials are available.
- **Live go-live checklist**: live merchant account approved → domain allowed → live variables set in Production → one small real payment → refund it from the portal → check the order notes.

## 6. Tests

- `tests/unit/payhere.test.ts`: hash, signature and amount formatting checked against an independent restatement of PayHere's documented PHP sample.
- `tests/unit/payhere-notify.test.ts`: every status, duplicates, double payment, amount and currency mismatch, tampering, wrong merchant, unknown and non-PayHere orders.
- `tests/e2e/checkout.spec.ts`: without credentials PayHere isn't offered, the API refuses it, and the notify endpoint returns 503.
- Manual run against the sandbox (10 Nov 2026, test values only): a bad signature and a tampered amount were rejected with no change. A valid success set the order to Processing, paid, with transaction id PH1 and stock reduced. A duplicate changed nothing, and a late "failed" only added a note. The pending, cancelled and invalid-link pages show the right wording.

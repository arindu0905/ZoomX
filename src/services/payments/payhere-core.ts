import { createHash } from "node:crypto";

/**
 * PayHere Checkout API primitives, per the official documentation
 * (support.payhere.lk → API & Mobile SDK → Checkout API, updated 4 Sep 2026):
 *
 *   hash   = UPPER(md5(merchant_id + order_id + amount + currency + UPPER(md5(merchant_secret))))
 *   md5sig = UPPER(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(md5(merchant_secret))))
 *
 * Amounts use two decimals, "." separator and no thousands separator.
 * Pure (no env, no Next.js) so it is unit-tested directly.
 */

export const PAYHERE_CHECKOUT_URL = {
  sandbox: "https://sandbox.payhere.lk/pay/checkout",
  live: "https://www.payhere.lk/pay/checkout", // "www" is required (PH-0022 otherwise)
} as const;

export const PAYHERE_STATUS = {
  SUCCESS: "2",
  PENDING: "0",
  CANCELED: "-1",
  FAILED: "-2",
  CHARGEDBACK: "-3",
} as const;

const md5Upper = (s: string) => createHash("md5").update(s, "utf8").digest("hex").toUpperCase();

/** Decimal string → integer minor units, without floating point. Null if malformed. */
export function decimalToMinor(amount: string, decimals = 2): number | null {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (!m) return null;
  const frac = (m[2] ?? "").padEnd(decimals, "0");
  if (frac.length > decimals && /[1-9]/.test(frac.slice(decimals))) return null; // more precision than the currency has
  return Number.parseInt(m[1], 10) * 10 ** decimals + Number.parseInt(frac.slice(0, decimals) || "0", 10);
}

/** Formats a decimal string as PayHere expects ("1450.00"). */
export function formatPayHereAmount(amount: string): string {
  const minor = decimalToMinor(amount);
  if (minor === null) throw new TypeError(`Invalid amount: ${amount}`);
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

export function checkoutHash(merchantId: string, orderId: string, amount: string, currency: string, secret: string) {
  return md5Upper(merchantId + orderId + formatPayHereAmount(amount) + currency + md5Upper(secret));
}

export interface PayHereNotification {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  status_message?: string;
  method?: string;
}

export function expectedNotifySignature(n: PayHereNotification, secret: string): string {
  return md5Upper(
    n.merchant_id + n.order_id + n.payhere_amount + n.payhere_currency + n.status_code + md5Upper(secret),
  );
}

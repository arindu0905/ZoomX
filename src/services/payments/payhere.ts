import "server-only";
import { getServerEnv } from "@/lib/env";
import { siteUrl } from "@/lib/site";
import type { Order } from "@/types/order";
import { decodeEntities } from "@/utils/text";
import { PAYHERE_CHECKOUT_URL, checkoutHash, formatPayHereAmount } from "./payhere-core";

export interface PayHereConfig {
  merchantId: string;
  secret: string;
  mode: "sandbox" | "live";
}

/** Null until both PayHere credentials are configured — the method is then not offered. */
export function getPayHereConfig(): PayHereConfig | null {
  const env = getServerEnv();
  if (!env.PAYHERE_MERCHANT_ID || !env.PAYHERE_MERCHANT_SECRET) return null;
  return { merchantId: env.PAYHERE_MERCHANT_ID, secret: env.PAYHERE_MERCHANT_SECRET, mode: env.PAYHERE_MODE };
}

export const isPayHereConfigured = () => getPayHereConfig() !== null;

/** PayHere rejects emojis/script-like content; keep values plain and short. */
const plain = (s: string, max = 100) =>
  decodeEntities(s)
    .replace(/[<>"]/g, "")
    .replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, "")
    .trim()
    .slice(0, max);

/**
 * The signed checkout form for an existing WooCommerce order. Amount and
 * currency come from the order as stored in WooCommerce — never from the
 * browser. The secret only contributes to the hash and never leaves the server.
 */
export function buildPayHereForm(order: Order, config: PayHereConfig) {
  const orderId = String(order.id);
  const amount = formatPayHereAmount(order.total);
  const back = `${siteUrl}/checkout/order/${order.id}?key=${encodeURIComponent(order.order_key)}`;
  const b = order.billing;
  const s = order.shipping.address_1 ? order.shipping : order.billing;
  const items = order.line_items.map((i) => `${plain(i.name, 60)} x${i.quantity}`).join(", ");

  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    return_url: back,
    cancel_url: `${back}&cancelled=1`,
    notify_url: `${siteUrl}/api/payments/payhere/notify`,
    first_name: plain(b.first_name, 50),
    last_name: plain(b.last_name, 50),
    email: b.email ?? "",
    phone: b.phone ?? "",
    address: plain([b.address_1, b.address_2].filter(Boolean).join(", ")),
    city: plain(b.city, 50),
    country: "Sri Lanka",
    delivery_address: plain([s.address_1, s.address_2].filter(Boolean).join(", ")),
    delivery_city: plain(s.city, 50),
    delivery_country: "Sri Lanka",
    order_id: orderId,
    items: plain(items || `Order ${order.number}`, 255),
    currency: order.currency,
    amount,
    hash: checkoutHash(config.merchantId, orderId, amount, order.currency, config.secret),
  };
  return { action: PAYHERE_CHECKOUT_URL[config.mode], fields };
}

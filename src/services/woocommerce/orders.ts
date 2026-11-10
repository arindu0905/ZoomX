import "server-only";
import { z } from "zod";
import { safeEqual } from "@/lib/security";
import { orderSchema, type Order } from "@/types/order";
import { restRequest } from "./rest";
import { StoreApiError } from "./store-api";

const ORDER_KEY = /^wc_order_[A-Za-z0-9]{6,40}$/;

/**
 * An order for its confirmation page. Access requires the order's secret
 * `order_key` (as on WooCommerce's own "order received" page), compared in
 * constant time. Returns null for unknown orders and wrong keys alike, so
 * the response doesn't reveal which order ids exist.
 */
export async function getOrderWithKey(id: number, key: string): Promise<Order | null> {
  if (!Number.isInteger(id) || id <= 0 || !ORDER_KEY.test(key)) return null;
  try {
    const order = await restRequest("GET", `orders/${id}`, orderSchema);
    return safeEqual(order.order_key, key) ? order : null;
  } catch (err) {
    if (err instanceof StoreApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

/** Server-side order read (no key check) — for verified gateway callbacks only. */
export async function getOrder(id: number): Promise<Order | null> {
  try {
    return await restRequest("GET", `orders/${id}`, orderSchema);
  } catch (err) {
    if (err instanceof StoreApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function updateOrder(id: number, patch: Record<string, unknown>): Promise<void> {
  await restRequest("PUT", `orders/${id}`, orderSchema, { body: patch });
}

/** Private note (visible to shop staff in WooCommerce, not to the customer). */
export async function addOrderNote(id: number, note: string): Promise<void> {
  await restRequest("POST", `orders/${id}/notes`, z.object({ id: z.number() }), {
    body: { note, customer_note: false },
  });
}

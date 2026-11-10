import { safeEqual } from "@/lib/security";
import type { Order } from "@/types/order";
import { PAYHERE_STATUS, decimalToMinor, expectedNotifySignature, type PayHereNotification } from "./payhere-core";

/**
 * Applies a PayHere server notification to the WooCommerce order.
 *
 * Rules:
 * - Only a correctly signed notification for our merchant can change anything.
 * - The paid amount and currency must equal the WooCommerce order total, or
 *   the order is put on hold for review and never marked paid.
 * - Idempotent: duplicates and out-of-order notices never re-pay a paid
 *   order or downgrade it (a later "failed" after "success" only adds a note).
 * - The order is only ever touched if it uses the headless PayHere method.
 */

export const PAYHERE_METHOD_ID = "zoomx_payhere";

export interface NotifyDeps {
  merchantId: string;
  secret: string;
  getOrder: (id: number) => Promise<Order | null>;
  updateOrder: (id: number, patch: Record<string, unknown>) => Promise<void>;
  addNote: (id: number, note: string) => Promise<void>;
}

export type NotifyOutcome =
  | { http: 200; result: "paid" | "duplicate" | "noted" | "failed" | "on_hold" }
  | { http: 400 | 401 | 404 | 409; result: "rejected"; reason: string };

const PAID_STATUSES = new Set(["processing", "completed", "refunded"]);
const isPaid = (o: Order) => !!o.date_paid || PAID_STATUSES.has(o.status);
const clean = (s: string | undefined, max = 120) =>
  (s ?? "")
    .replace(/[\r\n<>]/g, " ")
    .slice(0, max)
    .trim();

export async function processPayHereNotification(n: PayHereNotification, deps: NotifyDeps): Promise<NotifyOutcome> {
  if (!safeEqual(n.merchant_id, deps.merchantId)) {
    return { http: 400, result: "rejected", reason: "merchant mismatch" };
  }
  if (!safeEqual(n.md5sig.toUpperCase(), expectedNotifySignature(n, deps.secret))) {
    return { http: 401, result: "rejected", reason: "invalid signature" };
  }

  const id = Number(n.order_id);
  if (!Number.isInteger(id) || id <= 0) return { http: 400, result: "rejected", reason: "bad order id" };
  const order = await deps.getOrder(id);
  if (!order) return { http: 404, result: "rejected", reason: "unknown order" };
  if (order.payment_method !== PAYHERE_METHOD_ID) {
    return { http: 409, result: "rejected", reason: "order does not use PayHere" };
  }

  const ref = `PayHere payment ${clean(n.payment_id, 40)}${n.method ? ` (${clean(n.method, 20)})` : ""}`;
  const paid = isPaid(order);

  switch (n.status_code) {
    case PAYHERE_STATUS.SUCCESS: {
      if (paid) {
        // Duplicate (or a second payment for an already-paid order): never pay twice.
        if (order.transaction_id && order.transaction_id !== n.payment_id) {
          await deps.addNote(
            id,
            `${ref} reported success, but the order was already paid by ${clean(order.transaction_id, 40)}. Check for a double charge.`,
          );
        }
        return { http: 200, result: "duplicate" };
      }
      const amountOk =
        n.payhere_currency === order.currency &&
        decimalToMinor(n.payhere_amount) !== null &&
        decimalToMinor(n.payhere_amount) === decimalToMinor(order.total);
      if (!amountOk) {
        await deps.updateOrder(id, { status: "on-hold" });
        await deps.addNote(
          id,
          `${ref} succeeded for ${clean(n.payhere_amount, 20)} ${clean(n.payhere_currency, 5)}, which does not match the order total ${order.total} ${order.currency}. Held for review — not marked paid.`,
        );
        return { http: 200, result: "on_hold" };
      }
      await deps.updateOrder(id, { status: "processing", set_paid: true, transaction_id: n.payment_id });
      await deps.addNote(id, `${ref} verified: ${n.payhere_amount} ${n.payhere_currency}.`);
      return { http: 200, result: "paid" };
    }
    case PAYHERE_STATUS.FAILED: {
      if (!paid) {
        await deps.updateOrder(id, { status: "failed" });
        await deps.addNote(id, `${ref} failed${n.status_message ? `: ${clean(n.status_message)}` : "."}`);
        return { http: 200, result: "failed" };
      }
      await deps.addNote(id, `${ref} reported failure after the order was paid — ignored.`);
      return { http: 200, result: "noted" };
    }
    case PAYHERE_STATUS.CHARGEDBACK: {
      await deps.updateOrder(id, { status: "on-hold" });
      await deps.addNote(id, `${ref} was charged back. Order put on hold for review.`);
      return { http: 200, result: "on_hold" };
    }
    case PAYHERE_STATUS.PENDING:
    case PAYHERE_STATUS.CANCELED: {
      // Leave the order pending so the customer can retry; WooCommerce cancels
      // unpaid orders after its "Hold stock" window.
      if (!paid) {
        const what = n.status_code === PAYHERE_STATUS.PENDING ? "is pending" : "was cancelled by the customer";
        await deps.addNote(id, `${ref} ${what}.`);
      }
      return { http: 200, result: "noted" };
    }
    default:
      await deps.addNote(id, `${ref} sent unknown status ${clean(n.status_code, 5)}.`);
      return { http: 200, result: "noted" };
  }
}

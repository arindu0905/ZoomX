import { z } from "zod";

/** Subset of a WooCommerce REST v3 order. Amounts are decimal strings. */

const address = z.object({
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  address_1: z.string().default(""),
  address_2: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  postcode: z.string().default(""),
  country: z.string().default(""),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.number(),
  number: z.string(),
  order_key: z.string(),
  status: z.string(),
  currency: z.string(),
  date_created: z.string(),
  date_paid: z.string().nullable().optional(),
  total: z.string(),
  subtotal: z.string().optional(),
  discount_total: z.string(),
  shipping_total: z.string(),
  total_tax: z.string(),
  payment_method: z.string(),
  payment_method_title: z.string(),
  transaction_id: z.string().default(""),
  customer_id: z.number().default(0),
  customer_note: z.string().default(""),
  billing: address,
  shipping: address,
  line_items: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      quantity: z.number(),
      subtotal: z.string(),
      total: z.string(),
      sku: z.string().nullable().optional(),
      image: z.object({ src: z.string() }).partial().nullable().optional(),
    }),
  ),
  shipping_lines: z.array(z.object({ method_title: z.string(), total: z.string() })).default([]),
  coupon_lines: z.array(z.object({ code: z.string(), discount: z.string() })).default([]),
  meta_data: z.array(z.object({ key: z.string(), value: z.unknown() })).default([]),
});

export type Order = z.infer<typeof orderSchema>;

/** Customer-facing labels for WooCommerce order statuses. */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  processing: "Processing",
  "on-hold": "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Payment failed",
  "checkout-draft": "Draft",
};

export interface TrackingItem {
  provider: string;
  number: string;
  link: string | null;
}

/**
 * Tracking numbers, if a shipment-tracking plugin stores them on the order.
 * Reads the "WooCommerce Shipment Tracking" format (_wc_shipment_tracking_items).
 * WooCommerce core has no tracking field, so this is empty until such a
 * plugin is installed and used — nothing is invented.
 */
export function getTrackingItems(order: Pick<Order, "meta_data">): TrackingItem[] {
  const meta = order.meta_data.find((m) => m.key === "_wc_shipment_tracking_items");
  if (!Array.isArray(meta?.value)) return [];
  return (meta.value as Record<string, unknown>[])
    .map((t) => {
      const number = typeof t.tracking_number === "string" ? t.tracking_number.trim() : "";
      const provider = String(t.custom_tracking_provider || t.tracking_provider || "").trim();
      const rawLink = typeof t.custom_tracking_link === "string" ? t.custom_tracking_link : "";
      const link = rawLink.startsWith("https://") ? rawLink : null; // only https links are rendered
      return { provider, number, link };
    })
    .filter((t) => t.number.length > 0 && t.number.length <= 64);
}

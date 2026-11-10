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

import { z } from "zod";
import { storeImageSchema } from "./store-api";

/**
 * Subset of the Store API cart response (`/wc/store/v1/cart`). Every amount
 * is an integer string in minor units, calculated by WooCommerce — the
 * storefront never computes totals itself.
 */

const money = z.string();

export const cartItemSchema = z.object({
  key: z.string(),
  id: z.number(),
  type: z.string(),
  quantity: z.number(),
  quantity_limits: z
    .object({ minimum: z.number(), maximum: z.number(), multiple_of: z.number(), editable: z.boolean() })
    .partial()
    .optional(),
  name: z.string(),
  sku: z.string().default(""),
  permalink: z.string().optional(),
  images: z.array(storeImageSchema).default([]),
  variation: z.array(z.object({ attribute: z.string(), value: z.string() })).default([]),
  low_stock_remaining: z.number().nullable().optional(),
  prices: z.object({
    price: money,
    regular_price: money,
    sale_price: money,
    currency_code: z.string(),
    currency_minor_unit: z.number(),
  }),
  totals: z.object({ line_subtotal: money, line_total: money }),
});

export const cartCouponSchema = z.object({
  code: z.string(),
  discount_type: z.string().optional(),
  totals: z.object({ total_discount: money }),
});

export const shippingRateSchema = z.object({
  rate_id: z.string(),
  name: z.string(),
  price: money,
  selected: z.boolean(),
  delivery_time: z.string().optional(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  items_count: z.number(),
  coupons: z.array(cartCouponSchema).default([]),
  needs_shipping: z.boolean().default(true),
  has_calculated_shipping: z.boolean().default(false),
  shipping_rates: z
    .array(z.object({ package_id: z.union([z.number(), z.string()]), shipping_rates: z.array(shippingRateSchema) }))
    .default([]),
  payment_methods: z.array(z.string()).default([]),
  errors: z.array(z.object({ code: z.string(), message: z.string() })).default([]),
  totals: z.object({
    total_items: money,
    total_discount: money,
    total_shipping: money.nullable(),
    total_tax: money,
    total_price: money,
    currency_code: z.string(),
    currency_minor_unit: z.number(),
  }),
});

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;

/** Store API error body. */
export const storeErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.object({ status: z.number().optional() }).partial().optional(),
});

/** Store API `POST /checkout` response (subset). */
export const checkoutResultSchema = z.object({
  order_id: z.number(),
  order_key: z.string(),
  order_number: z.string().optional(),
  status: z.string(),
  payment_method: z.string(),
  payment_result: z
    .object({
      payment_status: z.string(),
      payment_details: z.array(z.object({ key: z.string(), value: z.unknown() })).default([]),
      redirect_url: z.string().default(""),
    })
    .nullable()
    .optional(),
});

export type CheckoutResult = z.infer<typeof checkoutResultSchema>;
